import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { BookOpen, ChevronLeft, ChevronRight, User } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Step1 = ({ activeStep, setActiveStep, onStepComplete }) => {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();
  const [userPhone, setUserPhone] = useState('');
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
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
            window.location.href = '/register';
          });
          return;
        }

        // Format phone number to match registration format
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
          formattedPhone = formattedPhone.substring(2);
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('0')) {
          formattedPhone = formattedPhone.substring(1);
        }

        setUserPhone(formattedPhone);

        // Fetch saved data from backend
        const response = await axios.get(`/application/status?phone=${formattedPhone}`);
        const { application } = response.data;

        if (application?.personalDetails) {
          const { candidateDetails, parentsDetails, address } = application.personalDetails;
          
          // Set form values from saved data
          setValue('name', candidateDetails?.name || '');
          setValue('mname', candidateDetails?.middleName || '');
          setValue('lname', candidateDetails?.lastName || '');
          setValue('gender', candidateDetails?.gender || '');
          
          // Format date of birth for input field
          if (candidateDetails?.dateOfBirth) {
            const dob = new Date(candidateDetails.dateOfBirth);
            const formattedDob = dob.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
            setValue('dob', formattedDob);
          }
          
          setValue('adhaar', candidateDetails?.adhaarNo || '');
          setValue('fatherName', parentsDetails?.fatherName || '');
          setValue('fatherPhone', parentsDetails?.fatherPhone || '');
          setValue('motherName', parentsDetails?.motherName || '');
          setValue('motherPhone', parentsDetails?.motherPhone || '');
          setValue('address', address?.fullAddress || '');
          setValue('state', address?.state || '');
          setValue('city', address?.city || '');
          setValue('pincode', address?.pincode || '');

          // Check if form was previously submitted
          if (application.status?.personalDetails?.completed) {
            setIsFormSubmitted(true);
          }
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
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      if (!userPhone) {
        throw new Error('Phone number not found. Please login again.');
      }

      // Save form data to localStorage with user's phone
      localStorage.setItem(`step1Data_${userPhone}`, JSON.stringify(data));

      // Structure the data according to the schema
      const applicationData = {
        phone: userPhone,
        personalDetails: {
          candidateDetails: {
            name: data.name,
            middleName: data.mname || '',
            lastName: data.lname || '',
            gender: data.gender,
            dateOfBirth: data.dob,
            adhaarNo: data.adhaar
          },
          parentsDetails: {
            fatherName: data.fatherName,
            fatherPhone: data.fatherPhone || '',
            motherName: data.motherName,
            motherPhone: data.motherPhone || ''
          },
          address: {
            fullAddress: data.address,
            state: data.state,
            city: data.city,
            pincode: data.pincode
          }
        }
      };

      console.log('Sending data:', JSON.stringify(applicationData, null, 2)); // Debug log

      const response = await axios.post('/application/update', applicationData);
      console.log('Response:', JSON.stringify(response.data, null, 2)); // Debug log

      // Check if the data was saved properly
      if (response.data?.success) {
        // Mark form as submitted
        setIsFormSubmitted(true);
        localStorage.setItem(`step1Submitted_${userPhone}`, 'true');

        // Call onStepComplete to enable next step
        if (onStepComplete) {
          onStepComplete();
        }

        await Swal.fire({
          title: "Success!",
          text: "Personal details saved successfully.",
          icon: "success",
          timer: 3000,
          timerProgressBar: true
        });
        setActiveStep(2);
      } else {
        throw new Error(response.data?.message || "Failed to save personal details");
      }
    } catch (error) {
      console.error("Submission error:", error);
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || error.message || "Failed to save personal details.",
        icon: "error",
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await axios.get(`/application/status?email=${email}`);
      if (response.data.status === 'submitted') {
        navigate('/step2');
      } else if (response.data.status === 'completed') {
        navigate('/step3');
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  return (
    <div className={activeStep === 1 ? "d-block" : "d-none"}>
      <div className="bg-light p-4 rounded mb-4">
        <h3 className="h5 text-primary mb-2 d-flex align-items-center">
          <User size={20} className="me-2" /> Personal Details
        </h3>
        <p className="text-muted small">Please provide your personal details as per official documents.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Details */}
        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">First Name (As per HighSchool Marksheet)*</label>
            <input 
              type="text" 
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              {...register("name", { required: "First name is required" })}
              disabled={isFormSubmitted}
            />
            {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
          </div>

          <div className="col-md-4">
            <label className="form-label">Middle Name</label>
            <input 
              type="text" 
              className="form-control" 
              {...register("mname")}
              disabled={isFormSubmitted}
            />
          </div>

          <div className="col-md-4">
            <label className="form-label">Last Name </label>
            <input 
              type="text" 
              className="form-control" 
              {...register("lname")}
              disabled={isFormSubmitted}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Gender *</label>
            <select 
              className={`form-control ${errors.gender ? "is-invalid" : ""}`}
              {...register("gender", { required: "Gender is required" })}
              disabled={isFormSubmitted}
            >
              <option value="">Select Your Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.gender && <div className="invalid-feedback">{errors.gender.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Date of Birth *</label>
            <input 
              type="date" 
              className={`form-control ${errors.dob ? "is-invalid" : ""}`}
              {...register("dob", { required: "Date of birth is required" })}
              disabled={isFormSubmitted}
            />
            {errors.dob && <div className="invalid-feedback">{errors.dob.message}</div>}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-4">
            <label className="form-label">Adhaar No</label>
            <input 
              type="text" 
              className={`form-control ${errors.adhaar ? "is-invalid" : ""}`}
              {...register("adhaar")}
              disabled={isFormSubmitted}
            />
            {errors.adhaar && <div className="invalid-feedback">{errors.adhaar.message}</div>}
          </div>
        </div>

        {/* Parent's Details */}
        <h5 className="mt-4 text-primary">Parent's Details</h5>
        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Father's Name (As per HighSchool Marksheet)</label>
            <input 
              type="text" 
              className={`form-control ${errors.fatherName ? "is-invalid" : ""}`}
              {...register("fatherName")}
              disabled={isFormSubmitted}
            />
            {errors.fatherName && <div className="invalid-feedback">{errors.fatherName.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Father's Mobile No </label>
            <input 
              type="text" 
              className="form-control"
              {...register("fatherPhone")}
              disabled={isFormSubmitted}
            />
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">Mother's Name (As per HighSchool Marksheet)</label>
            <input 
              type="text" 
              className={`form-control ${errors.motherName ? "is-invalid" : ""}`}
              {...register("motherName")}
              disabled={isFormSubmitted}
            />
            {errors.motherName && <div className="invalid-feedback">{errors.motherName.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label">Mother's Mobile No </label>
            <input 
              type="text" 
              className="form-control"
              {...register("motherPhone")}
              disabled={isFormSubmitted}
            />
          </div>
        </div>

        {/* Address Details */}
        <h4 className="mt-4 text-primary">Address for Communication</h4>
        <div className="mb-3">
          <label className="form-label">Address *</label>
          <textarea 
            {...register("address", { required: "Address is required" })} 
            rows={3}
            className={`form-control ${errors.address ? "is-invalid" : ""}`}
          ></textarea>
          {errors.address && <div className="invalid-feedback">{errors.address.message}</div>}
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <label className="form-label">State *</label>
            <input 
              type="text" 
              className={`form-control ${errors.state ? "is-invalid" : ""}`}
              {...register("state", { required: "State is required" })}
            />
            {errors.state && <div className="invalid-feedback">{errors.state.message}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label">City *</label>
            <input 
              type="text" 
              className={`form-control ${errors.city ? "is-invalid" : ""}`}
              {...register("city", { required: "City is required" })}
            />
            {errors.city && <div className="invalid-feedback">{errors.city.message}</div>}
          </div>

          <div className="col-md-3">
            <label className="form-label">Pincode *</label>
            <input 
              type="text" 
              className={`form-control ${errors.pincode ? "is-invalid" : ""}`}
              {...register("pincode", { required: "Pincode is required", pattern: /^[0-9]{6}$/ })}
            />
            {errors.pincode && <div className="invalid-feedback">Valid 6-digit Pincode required</div>}
          </div>
        </div>

        {/* Next Button */}
        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary d-flex align-items-center">
            Next: Academic Details <ChevronRight size={18} className="ms-2" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step1;






