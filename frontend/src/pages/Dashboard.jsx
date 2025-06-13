import React, { useState, useEffect } from "react";
import { FileText, Download, Clock, CheckCircle, User, AlertCircle } from "lucide-react";
import Header from "../components/Header";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';
import { useLocation } from 'react-router-dom';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState({
    candidateDetails: 'pending',
    documentsUploaded: 'pending',
    payment: 'pending'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicantData, setApplicantData] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const phone = localStorage.getItem('userPhone');
        if (!phone) {
          Swal.fire({
            title: 'Error!',
            text: 'Please login to view application status',
            icon: 'error',
            timer: 3000,
            timerProgressBar: true
          });
          setError('Please login to view application status');
          setLoading(false);
          return;
        }

        const response = await axios.get(`/application/status?phone=${phone}`);
        
        // Use optional chaining to safely access nested properties
        const application = response.data?.application;

        // Check if both personal and qualification details are completed
        const isCandidateDetailsComplete =
          application?.status?.personalDetails?.completed === true &&
          application?.status?.qualificationDetails?.completed === true;

        // Check if documents are completed
        const isDocumentsComplete = application?.status?.documents?.completed === true;

        // Check if payment is completed
        const isPaymentComplete = response.data.payment?.status === 'completed';

        setStatus({
          candidateDetails: isCandidateDetailsComplete ? 'completed' : 'pending',
          documentsUploaded: isDocumentsComplete ? 'completed' : 'pending',
          payment: isPaymentComplete ? 'completed' : 'pending'
        });

        // Log the status for debugging
        console.log('Application Status:', {
          candidateDetails: isCandidateDetailsComplete,
          documents: isDocumentsComplete,
          payment: isPaymentComplete,
          paymentData: response.data.payment,
          applicationId: response.data.application?.applicationId,
          name: response.data.application?.name,
          course: response.data.application?.course
        });

        setApplicantData(response.data);

      } catch (error) {
        console.error('Error fetching status:', error);
        setError(error.response?.data?.error || 'Failed to fetch application status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [location]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-success" size={20} />;
      case 'pending':
        return <Clock className="text-warning" size={20} />;
      default:
        return <AlertCircle className="text-danger" size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    const badgeClass = status === 'completed' ? 'bg-success' : 'bg-warning text-dark';
    return (
      <span className={`badge ${badgeClass} d-flex align-items-center justify-content-center gap-1 px-2 py-1`} style={{ fontSize: '0.75rem', minWidth: '90px', margin: '0 auto' }}>
        <div className="d-flex align-items-center justify-content-center w-100">
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </span>
    );
  };

  const handleEditDetails = () => {
    navigate('/registration');
  };

  const handleViewReceipt = (type = 'registration') => {
    const phone = localStorage.getItem('userPhone');
    if (phone) {
      navigate('/receipt', { state: { phone, type } });
    }
  };

  const handleDownloadForm = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        Swal.fire({
          title: 'Error',
          text: 'Please login to download the form',
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        });
        return;
      }

      const response = await axios.get(`/application/form/${phone}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `application-form.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading form:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to download application form',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  // Calculate seat lock confirmation deadline
  let seatLockDeadline = null;
  if (applicantData?.payment?.status === 'completed') {
    console.log('DEBUG: payment.completedAt =', applicantData?.payment?.completedAt);
    if (applicantData?.payment?.completedAt) {
      const paymentDate = new Date(applicantData.payment.completedAt);
      if (!isNaN(paymentDate)) {
        const deadlineDate = new Date(paymentDate.getTime() + 15 * 24 * 60 * 60 * 1000);
        seatLockDeadline = deadlineDate.toLocaleDateString();
      } else {
        console.warn('WARNING: Invalid payment.completedAt date:', applicantData.payment.completedAt);
      }
    } else {
      console.warn('WARNING: payment.completedAt is missing');
    }
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />
      <div className="container-fluid px-3 px-md-4 py-4">
        <div className="row g-3">
          <div className="col-12">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-2">
                <h5 className="mb-0">Application Status</h5>
                
                {/* <span className="badge bg-light text-primary">
                  Application ID: {applicantData.application.applicationId}
                </span> */}
              </div>
              <div className="card-body">
                <div className="alert alert-info d-flex align-items-start">
                  <CheckCircle size={20} className="text-success me-2 mt-1 flex-shrink-0" />
                  <div>
                    <h5 className="alert-heading">Application Submitted Successfully</h5>
                    <p className="mb-0">Your application has been received and is under review.</p>
                  </div>
                </div>

                <div className="row g-3 g-md-4 mb-4">
                  <div className="col-12 col-md-4">
                    <div className="card border-secondary h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <User size={20} className="text-primary me-2 flex-shrink-0" />
                          <h5 className="card-title mb-0">Personal Details</h5>
                        </div>
                        <p className="text-muted mb-2">Your personal information has been saved.</p>
                        <button className="btn btn-link p-0" onClick={handleEditDetails}>Edit Details</button>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="card border-secondary h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <FileText size={20} className="text-primary me-2 flex-shrink-0" />
                          <h5 className="card-title mb-0">Application Status</h5>
                        </div>
                        {loading ? (
                          <div className="text-center">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-sm table-borderless mb-0">
                              <tbody>
                                <tr>
                                  <td className="text-muted">Candidate Details</td>
                                  <td className="text-end">{getStatusBadge(status.candidateDetails)}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted">Documents</td>
                                  <td className="text-end">{getStatusBadge(status.documentsUploaded)}</td>
                                </tr>
                                <tr>
                                  <td className="text-muted">Payment</td>
                                  <td className="text-end">{getStatusBadge(status.payment)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="card border-secondary h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <Clock size={20} className="text-primary me-2 flex-shrink-0" />
                          <h5 className="card-title mb-0">Important Dates</h5>
                        </div>
                        <ul className="list-unstyled small">
                          <li style={{ fontSize: '18px' }}><strong>Seat Lock Confirmation: </strong>
                           {seatLockDeadline ?  (
      <>
        <span style={{ color: 'red' }}>Deadline  {seatLockDeadline}</span>
      </>
    )  : (status.payment === 'completed' ? 
                            'Date not available, contact support' : 'Within 15 days post Registration')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <h5>Documents</h5>
                <div className="bg-white rounded border border-secondary">
                  {/* ✅ Application Form */}
                  <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-text text-secondary me-2"></i>
                      <span className="fw-medium text-dark">Application Form</span>
                    </div>
                    <button 
                      className="btn btn-link text-primary fw-medium d-flex align-items-center"
                      onClick={handleDownloadForm}
                      disabled={status.payment !== 'completed'}
                      title={status.payment !== 'completed' ? 'Complete payment to download application form' : ''}
                    >
                      <i className="bi bi-download me-1"></i> Download
                    </button>
                  </div>

                  {/* ✅ Payment Receipt */}
                  <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-file-earmark-text text-secondary me-2"></i>
                      <span className="fw-medium text-dark">Payment Receipt</span>
                    </div>
                    <button 
                      className="btn btn-link text-primary fw-medium d-flex align-items-center"
                      onClick={() => handleViewReceipt('registration')}
                      disabled={status.payment !== 'completed'}
                      title={status.payment !== 'completed' ? 'Complete payment to view receipt' : ''}
                    >
                      <i className="bi bi-download me-1"></i> View Receipt
                    </button>
                  </div>

                  {/* ✅ Seat lock Payment Receipt */}
                  {applicantData?.seatPayment?.status === 'completed' && (
                    <div className="p-3 d-flex align-items-center justify-content-between border-bottom">
                      <div className="d-flex align-items-center">
                        <i className="bi bi-file-earmark-text text-secondary me-2"></i>
                        <span className="fw-medium text-dark">Seat lock Payment Receipt</span>
                      </div>
                      <button 
                        className="btn btn-link text-primary fw-medium d-flex align-items-center"
                        onClick={() => handleViewReceipt('seat')}
                      >
                        <i className="bi bi-download me-1"></i> View Receipt
                      </button>
                    </div>
                  )}

                  {/* ✅ Admit Card (Not Available Yet) */}
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <footer className="bg-light text-center py-3 small text-muted border-top fixed-bottom border-top ms-auto"
       style={{ width: "calc(100% - 280px)"}}>
       
          © {new Date().getFullYear()} LBSIMDS. All rights reserved.
       
    </footer> */}
    <footer className="bg-light text-center py-3 small text-muted border-top mt-auto">
      © {new Date().getFullYear()} LBSIMDS. All rights reserved.
    </footer>

    
    </div>
  );
};

export default Dashboard;
