import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Step1 from './Step1'
import Step2 from "./Step2";
import Step3 from "./Step3";
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, BookOpen, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const WizardComponent = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [stepStatus, setStepStatus] = useState({
    step1: { enabled: true, completed: false },  // Step 1 always enabled
    step2: { enabled: false, completed: false },
    step3: { enabled: false, completed: false }
  });

  useEffect(() => {
    const checkStepStatus = async () => {
      const phone = localStorage.getItem('userPhone');
      if (!phone) return;

      try {
        // Fetch application status from backend
        const response = await axios.get(`/application/status?phone=${phone}`);
        const { application } = response.data;

        // Update step status based on backend data
        setStepStatus({
          step1: {
            enabled: true, // Always enabled
            completed: application?.status?.personalDetails?.completed || false
          },
          step2: {
            enabled: application?.status?.personalDetails?.completed || false, // Enabled if step 1 is completed
            completed: application?.status?.qualificationDetails?.completed || false
          },
          step3: {
            enabled: application?.status?.qualificationDetails?.completed || false, // Enabled if step 2 is completed
            completed: application?.status?.documents?.completed || false
          }
        });

      } catch (error) {
        console.error('Error fetching application status:', error);
      }
    };

    checkStepStatus();
  }, [activeStep]); // Re-run when active step changes

  const handleStepClick = (step) => {
    // Only allow navigation if the step is enabled
    if (stepStatus[`step${step}`].enabled) {
      setActiveStep(step);
    }
  };

  const handleStepComplete = (step) => {
    setStepStatus(prev => {
      const newStatus = {
        ...prev,
        [`step${step}`]: { ...prev[`step${step}`], completed: true }
      };
      
      // Enable next step if current step is completed
      if (step < 3) {
        newStatus[`step${step + 1}`] = { 
          ...prev[`step${step + 1}`], 
          enabled: true 
        };
      }
      
      return newStatus;
    });
  };

  return (
    <div className="w-full min-h-screen px-4 py-6 flex-grow flex flex-col">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden w-full">
        <div className="p-4 text-white" style={{ backgroundColor: "#00509E" }}>
          <h2 className="h4 fw-bold">Candidate Registration</h2>
          <p className="small opacity-75">Please complete all sections to proceed to payment</p>
        </div>
      </div>

      <div className="p-4">
        <div className="d-flex flex-column flex-md-row mb-3">
          <button
            onClick={() => handleStepClick(1)}
            className={`d-flex align-items-center px-4 py-2 rounded mb-2 mb-md-0 me-md-2 ${
              activeStep === 1 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
            style={{
              backgroundColor: activeStep === 1 ? "#e3f2fd" : "#f3f4f6",
              color: activeStep === 1 ? "#0d6efd" : "#374151",
              border: "none",
            }}
          >
            <User size={18} className="me-2" />
            <span>Personal Details</span>
            {stepStatus.step1.completed && <span className="ms-2 text-success">✓</span>}
          </button>

          <button
            onClick={() => handleStepClick(2)}
            className={`d-flex align-items-center px-4 py-2 rounded mb-2 mb-md-0 me-md-2 ${
              activeStep === 2 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
            style={{
              backgroundColor: activeStep === 2 ? "#e3f2fd" : "#f3f4f6",
              color: activeStep === 2 ? "#0d6efd" : "#374151",
              border: "none",
              opacity: stepStatus.step2.enabled ? 1 : 0.5,
              cursor: stepStatus.step2.enabled ? "pointer" : "not-allowed"
            }}
            disabled={!stepStatus.step2.enabled}
          >
            <BookOpen size={18} className="me-2" />
            <span>Academic Details</span>
            {stepStatus.step2.completed && <span className="ms-2 text-success">✓</span>}
          </button>

          <button
            onClick={() => handleStepClick(3)}
            className={`d-flex align-items-center px-4 py-2 rounded mb-2 mb-md-0 me-md-2 ${
              activeStep === 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
            style={{
              backgroundColor: activeStep === 3 ? "#e3f2fd" : "#f3f4f6",
              color: activeStep === 3 ? "#0d6efd" : "#374151",
              border: "none",
              opacity: stepStatus.step3.enabled ? 1 : 0.5,
              cursor: stepStatus.step3.enabled ? "pointer" : "not-allowed"
            }}
            disabled={!stepStatus.step3.enabled}
          >
            <FileText size={18} className="me-2" />
            <span>Documents Upload</span>
            {stepStatus.step3.completed && <span className="ms-2 text-success">✓</span>}
          </button>
        </div>

        <div className="mt-3">
          {activeStep === 1 && <Step1 activeStep={activeStep} setActiveStep={setActiveStep} onStepComplete={() => handleStepComplete(1)} />}
          {activeStep === 2 && <Step2 activeStep={activeStep} setActiveStep={setActiveStep} onStepComplete={() => handleStepComplete(2)} />}
          {activeStep === 3 && <Step3 activeStep={activeStep} setActiveStep={setActiveStep} onStepComplete={() => handleStepComplete(3)} />}
        </div>
      </div>
    </div>
  );
};

export default WizardComponent;




