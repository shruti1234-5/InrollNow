import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Header from "../components/Header";
import Swal from 'sweetalert2';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const AppnStatus = () => {
    const [status, setStatus] = useState({
        candidateDetails: 'pending',
        documentsUploaded: 'pending',
        payment: 'pending'
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const phone = localStorage.getItem('userPhone');
                if (!phone) {
                    setError('Please login to view application status');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`/application-status/${phone}`);
                console.log('Full Response:', response.data);
                
                // Check if both personal and qualification details are completed
                const isCandidateDetailsComplete = 
                    response.data.status.personalDetails.completed && 
                    response.data.status.qualificationDetails.completed;

                // Check if documents are completed based on backend logic
                const isDocumentsComplete = response.data.status.documents.completed;

                console.log('Status Details:', {
                    personalDetails: response.data.status.personalDetails,
                    qualificationDetails: response.data.status.qualificationDetails,
                    documents: response.data.status.documents
                });

                console.log('Completion Status:', {
                    isCandidateDetailsComplete,
                    isDocumentsComplete,
                    documents: response.data.documents // Log the actual documents object
                });

                setStatus({
                    candidateDetails: isCandidateDetailsComplete ? 'completed' : 'pending',
                    documentsUploaded: isDocumentsComplete ? 'completed' : 'pending',
                    payment: 'pending'
                });

            } catch (error) {
                console.error('Error fetching status:', error);
                if (error.response?.status === 404) {
                    setError('No application found. Please complete your application first.');
                } else {
                    setError(error.response?.data?.error || 'Failed to fetch application status');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

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

    if (loading) {
        return (
            <div className="d-flex flex-column min-vh-100 bg-light">
                <Header />
                <div className="d-flex justify-content-center align-items-center flex-grow-1">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="d-flex flex-column min-vh-100 bg-light">
                <Header />
                <div className="container py-5 flex-grow-1">
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <Header />
            
            <div className="container-fluid py-4 flex-grow-1">
                <div className="card shadow-sm w-100">
                    <div className="card-header bg-primary text-white">
                        <h2 className="h5 mb-0">Application Status</h2>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th scope="col" style={{ width: '85%' }}>Activity</th>
                                        <th scope="col" style={{ width: '15%', minWidth: '90px' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <span className="ms-2">Candidate Details</span>
                                            </div>
                                        </td>
                                        <td className="text-end">{getStatusBadge(status.candidateDetails)}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <span className="ms-2">Documents Uploaded</span>
                                            </div>
                                        </td>
                                        <td className="text-end">{getStatusBadge(status.documentsUploaded)}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <span className="ms-2">Payment</span>
                                            </div>
                                        </td>
                                        <td className="text-end">{getStatusBadge(status.payment)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4">
                            <h6 className="text-muted mb-3">Status Legend:</h6>
                            <div className="d-flex flex-wrap gap-4">
                                <div className="d-flex align-items-center gap-2">
                                    <CheckCircle className="text-success" size={20} />
                                    <span>Completed</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <Clock className="text-warning" size={20} />
                                    <span>Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="bg-light text-center py-3 small text-muted border-top mt-auto">
                © {new Date().getFullYear()} LBSIMDS. All rights reserved.
            </footer>
        </div>
    );
};

 export default AppnStatus;

