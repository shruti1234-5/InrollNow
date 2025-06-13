import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Upload } from 'lucide-react';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Step3 = ({ activeStep, setActiveStep }) => {
  const { handleSubmit, formState: { errors } } = useForm();
  const [userPhone, setUserPhone] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempFormData, setTempFormData] = useState({
    profileImage: null,
    marksheet10: null,
    marksheet12: null,
    graduationMarksheet: null,
    idProof: null,
    gapCertificate: null,
  });
  const [formData, setFormData] = useState({
    profileImage: null,
    marksheet10: null,
    marksheet12: null,
    graduationMarksheet: null,
    idProof: null,
    gapCertificate: null,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const phone = localStorage.getItem('userPhone');
        if (!phone) {
          Swal.fire({
            title: 'Error!',
            text: 'Please login first',
            icon: 'error',
            timer: 3000,
            timerProgressBar: true
          }).then(() => { 
            window.location.href = '/login';
          });
          return;
        }
        setUserPhone(phone);

        // Fetch saved data from backend using the correct endpoint and query parameter
        const response = await axios.get(`/application/status?phone=${phone}`);
        const application = response.data?.application; // Access the nested application data

        if (application?.documents) {
          // Create a new object with the saved document information
          const savedDocuments = {};
          Object.keys(application.documents).forEach(key => {
            if (application.documents[key]) {
              // Store the full file path from the backend
              savedDocuments[key] = application.documents[key];
            }
          });

          // setFormData(prevData => ({
          //   ...prevData,
          //   ...savedDocuments
          // })); // Remove this, formData is not used for file objects
          setTempFormData(prevData => ({
            ...prevData,
            ...savedDocuments
          }));
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
        if (error.response?.status === 404) {
          // If no application found, form will remain empty
          console.log('No existing application found');
        } else {
          Swal.fire({
            title: 'Error!',
            text: 'Failed to load saved data. Please try again.',
            icon: 'error',
            timer: 3000,
            timerProgressBar: true
          });
        }
      }
    };

    loadSavedData();
  }, []);

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      // Validate file size
      const maxSize = name === 'profileImage' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        Swal.fire({
          title: 'Error!',
          text: `${name === 'profileImage' ? 'Profile image' : 'Document'} must be less than ${maxSize / (1024 * 1024)}MB`,
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        });
        // Clear the file input
        e.target.value = null;
        return;
      }

      // Validate file type
      const acceptedTypes = name === 'profileImage' ? ['image/jpeg', 'image/png'] : ['application/pdf'];
      if (!acceptedTypes.includes(file.type)) {
         Swal.fire({
          title: 'Error!',
          text: `${name === 'profileImage' ? 'Profile image' : 'Document'} must be in a valid format (${name === 'profileImage' ? 'JPG, PNG' : 'PDF'})`,
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        });
        // Clear the file input
        e.target.value = null;
        return;
      }

      // Store the actual File object
      setTempFormData(prevData => ({
        ...prevData,
        [name]: file
      }));
    }
     // Clear the input value so the same file can be selected again if needed
     e.target.value = null;
  };

  // Handle file removal
  const handleFileRemove = (e, name) => {
    e.preventDefault();
    e.stopPropagation();
    setTempFormData(prevData => ({
      ...prevData,
      [name]: null
    }));
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    setShowValidation(true);
    
    // Basic validation: check if required files are present
    const requiredFiles = ['profileImage']; // Example: Profile image is required
    for (const field of requiredFiles) {
      if (!tempFormData[field]) {
        Swal.fire({
          title: 'Error!',
          text: `${field.replace(/([A-Z])/g, ' $1').trim()} is required.`,
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      // Ensure userPhone is available
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        Swal.fire({
          title: 'Error!',
          text: 'Phone number not found. Please login again.',
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        }).then(() => {
          navigate('/login');
        });
        setIsSubmitting(false);
        return;
      }

      // Create FormData to send files
      const formDataToSend = new FormData();
      formDataToSend.append('phone', phone);
      
      // Append files if they exist in tempFormData
      Object.keys(tempFormData).forEach(key => {
        if (tempFormData[key]) {
          formDataToSend.append(key, tempFormData[key]);
        }
      });

      console.log('Sending Step 3 data (FormData):', Object.fromEntries(formDataToSend.entries()));

      // Use axios.post with FormData
      const response = await axios.post('/application/update', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Step 3 Response:', JSON.stringify(response.data, null, 2));

      if (response.data?.success) {
        localStorage.setItem(`step3Submitted_${phone}`, 'true');

        Swal.fire({
          title: 'Success!',
          text: 'Documents uploaded successfully. Redirecting to Payment.',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true
        });
        
        navigate('/payment', { state: { freshData: true, timestamp: Date.now() } });

      } else {
        throw new Error(response.data?.message || 'Failed to submit Step 3 - Unexpected response.');
      }
    } catch (error) {
      console.error('Submission error Step 3:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || error.message || 'Failed to submit Step 3',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setIsSubmitting(false);
    setShowValidation(false);
  };

  const handleProceedToPayment = () => {
    navigate('/payment');
  };

  return (
    <div className={activeStep === 3 ? "d-block" : "d-none"}>
      {/* Section Header */}
      <div className="bg-light p-4 rounded mb-4">
        <h3 className="h5 text-primary mb-2">
        <FileText size={20} className="me-2" /> Documents Upload
        </h3>
        <p className="text-muted small">
          Please upload clear scanned copies of the following documents. Profile image must be JPG or PNG format (Max. 2MB). Other documents must be in PDF format (Max. 5MB).
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="row">
        {[
          { label: "Passport Size Photograph", name: "profileImage", accept: "image/jpeg,image/png", required: true },
          { label: "10th Mark Sheet", name: "marksheet10", accept: "application/pdf", required: false },
          { label: "12th Mark Sheet", name: "marksheet12", accept: "application/pdf", required: false },
          { label: "Graduation Mark Sheet", name: "graduationMarksheet", accept: "application/pdf", required: false },
          { label: "ID Proof (Aadhar/PAN/Passport)", name: "idProof", accept: "application/pdf", required: false },
        ].map((file, index) => (
          file.show !== false && (
          <div key={index} className="col-12 mb-4">
            <label className="form-label fw-bold">{file.label} {file.required && '*'}</label>
            <div
              className={`p-4 text-center w-100 ${
                file.required && !tempFormData[file.name] ? 'border-danger' : ''
              }`}
              style={{
                border: "2px dotted #6c757d",
                borderRadius: "5px",
                cursor: "pointer",
                backgroundColor: tempFormData[file.name] ? "#f8f9fa" : "white",
              }}
            >
              <input
                type="file"
                className="d-none"
                id={file.name}
                name={file.name}
                accept={file.accept}
                onChange={handleFileChange}
                onClick={(e) => e.target.value = ''}
              />
              <label
                htmlFor={file.name}
                className="d-flex flex-column align-items-center"
                style={{ cursor: "pointer" }}
              >
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: tempFormData[file.name] ? "#e9ecef" : "#f8f9fa",
                  }}
                >
                  {file.accept.includes("image") ? (
                    <i className="bi bi-image text-secondary fs-4"></i>
                  ) : (
                    <i className="bi bi-file-earmark-pdf text-danger fs-4"></i>
                  )}
                </div>
                {/* Check if tempFormData[file.name] is a File object (newly selected) or a string (saved path) */}
                {tempFormData[file.name] && typeof tempFormData[file.name] === 'object' ? ( // It's a new File object
                  <>
                    <div className="d-flex align-items-center justify-content-center">
                      <span className="text-success fw-medium me-2">
                        <i className="bi bi-check-circle-fill me-1"></i>
                        {tempFormData[file.name].name}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={(e) => handleFileRemove(e, file.name)}
                      >
                        <i className="bi bi-x-circle"></i> Remove
                      </button>
                    </div>
                    <p className="text-muted small">
                      {(tempFormData[file.name].size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </>
                ) : tempFormData[file.name] && typeof tempFormData[file.name] === 'string' ? ( // It's a saved file path (string)
                  <>
                     <div className="d-flex align-items-center justify-content-center">
                      <span className="text-success fw-medium me-2">
                         <i className="bi bi-check-circle-fill me-1"></i>
                         {/* Extract filename from path for display */}
                         {/* Handle both forward and backslashes */}
                         {/* Display only the filename from the path */}
                         {tempFormData[file.name].split(/[\/]/).pop()} {/* This line extracts and displays the filename */}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger ms-3"
                        onClick={(e) => handleFileRemove(e, file.name)}
                      >
                        <i className="bi bi-x-circle"></i> Remove
                      </button>
                    </div>
                     <p className="text-muted small">
                       File uploaded
                     </p>
                  </>
                ) : (
                  // No file uploaded yet
                  <>
                    <span className="text-primary fw-medium">Click to upload</span> or drag and drop
                    <p className="text-muted small mt-1">
                      {file.accept.includes("pdf") ? "PDF only (Max. 5MB)" : "JPG or PNG (Max. 2MB)"} {/* Corrected max size text */}
                    </p>
                  </>
                )}
              </label>
            </div>
            {file.required && !tempFormData[file.name] && showValidation && (
              <div className="invalid-feedback d-block">
                {file.label} is required
              </div>
            )}
          </div>
          )
        ))}
        </div>

        {/* Navigation Buttons */}
        <div className="d-flex justify-content-between mt-5">
          <button 
            type="button" 
            onClick={() => setActiveStep(2)} 
            className="btn btn-secondary d-flex align-items-center"
            disabled={isSubmitting}
          >
            <ChevronLeft size={18} className="me-2" /> Back: Academic Details
          </button>

          <button 
            type="submit" 
            className="btn btn-primary d-flex align-items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              <>
                Proceed to Payment <ChevronRight size={18} className="ms-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step3;