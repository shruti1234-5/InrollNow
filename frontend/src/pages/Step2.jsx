import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Book, School, Calendar } from 'lucide-react';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Step2 = ({ activeStep, setActiveStep, onStepComplete }) => {
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
        setUserPhone(phone);

        // Fetch saved data from backend
        const response = await axios.get(`/application/status?phone=${phone}`);
        const { application } = response.data;

        if (application?.qualificationDetails) {
          const { highSchool, intermediate, higherEducation } = application.qualificationDetails;
          
          // Set high school details
          setHighSchool({
            board: highSchool?.board || '',
            schoolName: highSchool?.schoolName || '',
            rollNumber: highSchool?.rollNumber || '',
            passingYear: highSchool?.passingYear || '',
            percentage: highSchool?.percentage || ''
          });

          // Set intermediate details
          setIntermediate({
            board: intermediate?.board || '',
            schoolName: intermediate?.schoolName || '',
            rollNumber: intermediate?.rollNumber || '',
            passingYear: intermediate?.passingYear || '',
            percentage: intermediate?.percentage || ''
          });

          // Set higher education details
          if (Array.isArray(higherEducation) && higherEducation.length > 0) {
            console.log('Loading higher education:', higherEducation);
            setHigherEducation(higherEducation.map(edu => ({
              degree: edu.degree || '',
              university: edu.university || '',
              passoutStatus: edu.passoutStatus || '',
              percentage: edu.passoutStatus === 'Passed out' ? (edu.percentage || '') : ''
            })));
          }

          // Set form values
          if (highSchool) {
            setValue('board', highSchool.board);
            setValue('percentage', highSchool.percentage);
            setValue('passingYear', highSchool.passingYear);
          }
          if (intermediate) {
            setValue('intermediateBoard', intermediate.board);
            setValue('intermediatePercentage', intermediate.percentage);
            setValue('intermediateYear', intermediate.passingYear);
          }

          // Check if form was previously submitted
          if (application.status?.qualificationDetails?.completed) {
            setIsFormSubmitted(true);
          }
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedData();
  }, [setValue]);

  const [highSchool, setHighSchool] = useState({
    board: "",
    schoolName: "",
    rollNumber: "",
    passingYear: "",
    percentage: "",
  });

  const [intermediate, setIntermediate] = useState({
    board: "",
    schoolName: "",
    rollNumber: "",
    passingYear: "",
    percentage: "",
  });

  const [higherEducation, setHigherEducation] = useState([]);

  const handleChange = (e, section, index = null) => {
    const { name, value } = e.target;

    if (section === "highSchool") {
      setHighSchool({ ...highSchool, [name]: value });
      // Update form values
      if (name === 'board') setValue('board', value);
      if (name === 'percentage') setValue('percentage', value);
      if (name === 'passingYear') setValue('passingYear', value);
    } else if (section === "intermediate") {
      // Map the form field names to state field names
      const fieldMapping = {
        intermediateBoard: 'board',
        intermediatePercentage: 'percentage',
        intermediateYear: 'passingYear',
        schoolName: 'schoolName',
        rollNumber: 'rollNumber'
      };
      
      const stateField = fieldMapping[name] || name;
      setIntermediate({ ...intermediate, [stateField]: value });
      
      // Update form values
      if (name === 'intermediateBoard') setValue('intermediateBoard', value);
      if (name === 'intermediatePercentage') setValue('intermediatePercentage', value);
      if (name === 'intermediateYear') setValue('intermediateYear', value);
    } else if (section === "higherEducation" && index !== null) {
      const updatedHigherEducation = [...higherEducation];
      updatedHigherEducation[index][name] = value;
      setHigherEducation(updatedHigherEducation);
    }

    // Save to localStorage whenever there's a change
    localStorage.setItem(`step2Data_${userPhone}`, JSON.stringify({
      highSchool,
      intermediate,
      higherEducation
    }));
  };

  const addHigherEducation = () => {
    const newHigherEducation = [
      ...higherEducation,
      { degree: "", university: "", passoutStatus: "", percentage: "" },
    ];
    setHigherEducation(newHigherEducation);
    // Save to localStorage
    localStorage.setItem(`step2Data_${userPhone}`, JSON.stringify({
      highSchool,
      intermediate,
      higherEducation: newHigherEducation
    }));
  };

  const removeHigherEducation = (index) => {
    const newHigherEducation = higherEducation.filter((_, i) => i !== index);
    setHigherEducation(newHigherEducation);
    // Save to localStorage
    localStorage.setItem(`step2Data_${userPhone}`, JSON.stringify({
      highSchool,
      intermediate,
      higherEducation: newHigherEducation
    }));
  };

  const onSubmit = async (formData) => {
    setLoading(true);
    try {
      // Ensure userPhone is available
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
        setLoading(false);
        return;
      }

      // Structure the data according to the backend schema
      const applicationData = {
        phone: phone,
        qualificationDetails: {
          highSchool: {
            board: highSchool.board,
            schoolName: highSchool.schoolName,
            rollNumber: highSchool.rollNumber,
            passingYear: parseInt(highSchool.passingYear),
            percentage: parseFloat(highSchool.percentage)
          },
          intermediate: {
            board: intermediate.board,
            schoolName: intermediate.schoolName,
            rollNumber: intermediate.rollNumber,
            passingYear: parseInt(intermediate.passingYear),
            percentage: parseFloat(intermediate.percentage)
          },
          higherEducation: higherEducation.map(edu => ({
            degree: edu.degree,
            university: edu.university,
            passoutStatus: edu.passoutStatus,
            percentage: edu.passoutStatus === 'Passed out' ? parseFloat(edu.percentage) : undefined
          }))
        }
      };

      console.log('Sending Step 2 data:', JSON.stringify(applicationData, null, 2)); // Debug log

      const response = await axios.post('/application/update', applicationData);

      console.log('Step 2 Response:', JSON.stringify(response.data, null, 2)); // Debug log

      if (response.data?.success) {
        // Save form data to local storage (optional, backend is source of truth)
        localStorage.setItem(`step2Data_${phone}`, JSON.stringify({
          highSchool,
          intermediate,
          higherEducation
        }));
        localStorage.setItem(`step2Submitted_${phone}`, 'true');

        Swal.fire({
          title: 'Success!',
          text: 'Academic details saved successfully.',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true
        });
        setActiveStep(3);
        if (onStepComplete) onStepComplete();
      } else {
        throw new Error(response.data?.message || 'Failed to submit Step 2 - Unexpected response.');
      }
    } catch (error) {
      console.error('Submission error Step 2:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || error.message || 'Failed to submit Step 2',
        icon: 'error',
      });
    }
    setLoading(false);
  };

  return (
    <div className={activeStep === 2 ? "d-block" : "d-none"}>
      {/* Section Header */}
      <div className="bg-light p-4 rounded mb-4">
        <h3 className="h5 text-primary mb-2 d-flex align-items-center">
          <BookOpen size={20} className="me-2" /> Academic Details
        </h3>
        <p className="text-muted small">
          Please provide your academic information accurately. This will be verified during the admission process.
        </p>
      </div>

      {/* Academic Information */}
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* 10th Standard */}
        <div className="mb-3">
          <h5 className="text-primary">10th Standard / Equivalent</h5>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Board</label>
              <input 
                type="text" 
                name="board" 
                className={`form-control ${errors.board ? "is-invalid" : ""}`}
                {...register("board")}
                value={highSchool.board}
                onChange={(e) => handleChange(e, "highSchool")}
                disabled={isFormSubmitted}
              />
              {errors.board && <div className="invalid-feedback">{errors.board.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">School Name</label>
              <input 
                type="text" 
                name="schoolName" 
                className="form-control" 
                value={highSchool.schoolName}
                onChange={(e) => handleChange(e, "highSchool")}
                disabled={isFormSubmitted}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Roll Number</label>
              <input 
                type="text" 
                name="rollNumber" 
                className="form-control" 
                value={highSchool.rollNumber}
                onChange={(e) => handleChange(e, "highSchool")}
                disabled={isFormSubmitted}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Percentage</label>
              <input 
                type="number" 
                name="percentage" 
                className={`form-control ${errors.percentage ? "is-invalid" : ""}`}
                {...register("percentage")}
                value={highSchool.percentage}
                onChange={(e) => handleChange(e, "highSchool")}
                disabled={isFormSubmitted}
              />
              {errors.percentage && <div className="invalid-feedback">{errors.percentage.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Year of Passing</label>
              <input 
                type="number" 
                name="passingYear" 
                className={`form-control ${errors.passingYear ? "is-invalid" : ""}`}
                {...register("passingYear")}
                value={highSchool.passingYear}
                onChange={(e) => handleChange(e, "highSchool")}
                disabled={isFormSubmitted}
              />
              {errors.passingYear && <div className="invalid-feedback">{errors.passingYear.message}</div>}
            </div>
          </div>
        </div>

        {/* 12th Standard */}
        <div className="mb-3">
          <h5 className="text-primary">12th Standard / Equivalent</h5>
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Board</label>
              <input 
                type="text" 
                className={`form-control ${errors.intermediateBoard ? "is-invalid" : ""}`}
                {...register("intermediateBoard")}
                value={intermediate.board}
                onChange={(e) => handleChange(e, "intermediate")}
                disabled={isFormSubmitted}
              />
              {errors.intermediateBoard && <div className="invalid-feedback">{errors.intermediateBoard.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">School Name</label>
              <input 
                type="text" 
                name="schoolName" 
                className="form-control" 
                value={intermediate.schoolName}
                onChange={(e) => handleChange(e, "intermediate")}
                disabled={isFormSubmitted}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Roll Number</label>
              <input 
                type="text" 
                name="rollNumber" 
                className="form-control" 
                value={intermediate.rollNumber}
                onChange={(e) => handleChange(e, "intermediate")}
                disabled={isFormSubmitted}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Percentage</label>
              <input 
                type="number" 
                className={`form-control ${errors.intermediatePercentage ? "is-invalid" : ""}`}
                {...register("intermediatePercentage")}
                value={intermediate.percentage}
                onChange={(e) => handleChange(e, "intermediate")}
                disabled={isFormSubmitted}
              />
              {errors.intermediatePercentage && <div className="invalid-feedback">{errors.intermediatePercentage.message}</div>}
            </div>
            <div className="col-md-4">
              <label className="form-label">Year of Passing</label>
              <input 
                type="number" 
                className={`form-control ${errors.intermediateYear ? "is-invalid" : ""}`}
                {...register("intermediateYear")}
                value={intermediate.passingYear}
                onChange={(e) => handleChange(e, "intermediate")}
                disabled={isFormSubmitted}
              />
              {errors.intermediateYear && <div className="invalid-feedback">{errors.intermediateYear.message}</div>}
            </div>
          </div>
        </div>

        {/* Higher Education */}
        <div className="mb-3">
          {higherEducation.map((edu, index) => (
            <div key={index} className="row mb-2">
              <h5 className="text-primary">Graduation / Higher Education</h5>
              <div className="col-md-3">
                <label className="form-label">Degree</label>
                <input 
                  type="text" 
                  name="degree" 
                  className="form-control" 
                  value={edu.degree}
                  onChange={(e) => handleChange(e, "higherEducation", index)}
                  disabled={isFormSubmitted}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">University</label>
                <input 
                  type="text" 
                  name="university" 
                  className="form-control" 
                  value={edu.university}
                  onChange={(e) => handleChange(e, "higherEducation", index)}
                  disabled={isFormSubmitted}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Passout Status</label>
                <select 
                  name="passoutStatus" 
                  className="form-control" 
                  value={edu.passoutStatus}
                  onChange={(e) => handleChange(e, "higherEducation", index)}
                  disabled={isFormSubmitted}
                >
                  <option value="">Select Status</option>
                  <option value="Appearing">Appearing</option>
                  <option value="Passed out">Passed out</option>
                </select>
              </div>
              {edu.passoutStatus === "Passed out" && (
                <div className="col-md-3">
                  <label className="form-label">Percentage</label>
                  <input 
                    type="number" 
                    name="percentage" 
                    className="form-control"
                    min="0" 
                    max="100" 
                    step="0.01" 
                    value={edu.percentage}
                    onChange={(e) => handleChange(e, "higherEducation", index)}
                    disabled={isFormSubmitted}
                  />
                </div>
              )}
              <div className="row mt-2">
                <div className="col-md-12 text-end">
                  <button 
                    type="button" 
                    className="btn btn-danger ms-2" 
                    onClick={() => removeHigherEducation(index)}
                    disabled={isFormSubmitted}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button 
            type="button" 
            className="btn btn-secondary mt-3" 
            onClick={addHigherEducation}
            disabled={isFormSubmitted}
          >
            Add Higher Education
          </button>
        </div>

        {/* Navigation Buttons */}
        <div className="d-flex justify-content-between mt-5">
          <button 
            type="button" 
            onClick={() => setActiveStep(1)} 
            className="btn btn-secondary d-flex align-items-center"
            disabled={loading}
          >
            <ChevronLeft size={18} className="me-2" /> Back: Personal Details
          </button>

          <button 
            type="submit" 
            className="btn btn-primary d-flex align-items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Submitting...
              </>
            ) : (
              <>
                Next: Document Upload <ChevronRight size={18} className="ms-2" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Step2;



