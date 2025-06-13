import React, { useEffect, useState } from 'react';
import axios from 'axios';
import logo from '../assets/download.png';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, CheckCircle } from 'lucide-react';
import Header from '../components/Header';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const Payment = () => {
  const [applicantData, setApplicantData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [formComplete, setFormComplete] = useState(false);
  const [seatPaymentCompleted, setSeatPaymentCompleted] = useState(false);
  const [seatPaymentLoading, setSeatPaymentLoading] = useState(false);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const phone = localStorage.getItem('userPhone');
        if (!phone) {
          navigate('/login');
          return;
        }

        // Fetch application status (which includes student details, payment status, and document status)
        const appResponse = await axios.get(`/application/status?phone=${phone}`);
        console.log('Application data for payment page:', appResponse.data);
        
        // We expect the backend /application/status to return all necessary data
        const combinedData = appResponse.data;

        console.log('Fetched combinedData.status:', combinedData.application?.status);

        setApplicantData(combinedData);
        
        // Check if registration payment is already completed
        if (combinedData.payment?.status === 'completed') {
          setPaymentCompleted(true);
        }

        // Check if seat payment is already completed
        if (combinedData.seatPayment?.status === 'completed') {
          setSeatPaymentCompleted(true);
        } else {
          setSeatPaymentCompleted(false);
        }

        // Check if all required sections are completed using optional chaining
        const isFormComplete = 
          combinedData.application?.status?.personalDetails?.completed === true &&
          combinedData.application?.status?.qualificationDetails?.completed === true &&
          combinedData.application?.status?.documents?.completed === true;

        setFormComplete(isFormComplete);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data for payment page:', error);
        // More specific error message if application not found
        if (error.response?.status === 404) {
          setError('Application data not found. Please complete the application form first.');
        } else {
          setError('Failed to load application data. Please try again later.');
        }
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/payment/create', {
        amount: 750, // Amount in paise (750 * 100)
        currency: 'INR',
        type: 'registration',
        phone: applicantData?.application?.phone,
        course: applicantData?.application?.course
      });

      console.log('Order created:', response.data);

      // Extract order details from response
      const { id: orderId, amount: orderAmount, currency: orderCurrency } = response.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: orderCurrency,
        name: "Admission Portal",
        description: "Course Registration Fee",
        order_id: orderId,
        handler: async function (response) {
          try {
            // Log the complete Razorpay response
            console.log('Complete Razorpay response:', response);
            
            // Validate required fields
            if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
              console.error('Missing fields in Razorpay response:', {
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature
              });
              throw new Error('Missing required payment details from Razorpay');
            }

            const verifyData = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              phone: applicantData?.application?.phone,
              type: 'registration'
            };

            console.log('Sending verification data:', verifyData);

            const verifyResponse = await axios.post('/payment/verify', verifyData);

            if (verifyResponse.data.success) {
              // Update payment status in database
              const updateData = {
                phone: applicantData?.application?.phone,
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                status: 'completed',
                completedAt: new Date().toISOString(),
                type: 'registration',
                amount: orderAmount // Use the order amount from the initial creation
              };

              console.log('Sending update data:', updateData);

              const updateResponse = await axios.post('/payment/update', updateData);

              if (updateResponse.data.success) {
                setPaymentCompleted(true);
                Swal.fire({
                  title: 'Success!',
                  text: 'Payment successful!',
                  icon: 'success',
                  timer: 3000,
                  timerProgressBar: true
                });
                navigate('/dashboard');
              } else {
                throw new Error('Failed to update payment status');
              }
            } else {
              // Update payment status as failed
              const failedUpdateData = {
                phone: applicantData?.application?.phone,
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                status: 'failed',
                type: 'registration',
                amount: orderAmount // Use the order amount from the initial creation
              };

              console.log('Sending failed update data:', failedUpdateData);

              await axios.post('/payment/update', failedUpdateData);
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment error details:', error);
            Swal.fire({
              title: 'Error!',
              text: error.message || 'Payment failed',
              icon: 'error',
              timer: 3000,
              timerProgressBar: true
            });
          }
        },
        prefill: {
          name: applicantData?.application?.name || '',
          email: applicantData?.application?.email || '',
          contact: applicantData?.application?.phone || ''
        },
        theme: {
          color: "#3399cc"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to create payment',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setLoading(false);
  };

  const downloadReceipt = async () => {
    try {
      const response = await axios.get(`/payment/receipt/${localStorage.getItem('userPhone')}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'receipt.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to download receipt',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  const downloadApplicationForm = async () => {
    try {
      const response = await axios.get(`/application/form/${localStorage.getItem('userPhone')}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'application_form.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to download application form',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  const handleSeatConfirmationPayment = async () => {
    if (!paymentCompleted) {
      return;
    }
    try {
      setSeatPaymentLoading(true);
      setError(null);

      // Create order on backend
      const orderResponse = await axios.post('/payment/create', {
        amount: 10000,
        currency: 'INR',
        type: 'seat',
        phone: applicantData?.application?.phone,
        course: applicantData?.application?.course
      });

      console.log('Order response (seat):', orderResponse.data);

      const { id: orderId, amount: orderAmount, currency } = orderResponse.data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency,
        name: "Admission Portal",
        description: "Seat Confirmation Payment",
        order_id: orderId,
        prefill: {
          name: applicantData?.application?.name || '',
          email: applicantData?.application?.email || '',
          contact: applicantData?.application?.phone || ''
        },
        handler: async (response) => {
          try {
            console.log('Payment response:', response);
            
            // Verify payment on backend
            const verifyResponse = await axios.post('/payment/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              phone: applicantData?.application?.phone,
              type: 'seat'
            });

            if (verifyResponse.data.success) {
              // Update application status in backend
              try {
                const updateResponse = await axios.post('/payment/update', {
                  phone: applicantData?.application?.phone,
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  status: 'completed',
                  completedAt: new Date().toISOString(),
                  type: 'seat',
                  amount: orderAmount
                });

                console.log('Sending seat payment update data with amount:', updateResponse.data.amount);

                if (updateResponse.data.success) {
                  setSeatPaymentCompleted(true);
                  setSuccess("Seat confirmation payment successful!");
                  Swal.fire({
                    title: 'Success!',
                    text: 'Seat confirmation payment successful. Redirecting to Dashboard.',
                    icon: 'success',
                    timer: 3000,
                    timerProgressBar: true
                  }).then(() => {
                    navigate('/dashboard');
                  });
                } else {
                  setError("Seat confirmation payment successful but status update failed. Please contact support.");
                  Swal.fire({
                    title: 'Error!',
                    text: 'Seat confirmation payment successful but status update failed. Please contact support.',
                    icon: 'error',
                    timer: 3000,
                    timerProgressBar: true
                  });
                }
              } catch (updateError) {
                console.error('Error updating seat confirmation payment status:', updateError);
                setError("Seat confirmation payment successful but status update failed. Please contact support.");
                Swal.fire({
                  title: 'Error!',
                  text: 'Seat confirmation payment successful but status update failed. Please contact support.',
                  icon: 'error',
                  timer: 3000,
                  timerProgressBar: true
                });
              }
            } else {
              // Update payment status as failed
              try {
                await axios.post('/payment/update', {
                  phone: applicantData?.application?.phone,
                  payment_id: response.razorpay_payment_id,
                  order_id: response.razorpay_order_id,
                  status: 'failed',
                  type: 'seat',
                  amount: orderAmount
                });
                setError(verifyResponse.data.error || "Seat confirmation payment verification failed");
                Swal.fire({
                  title: 'Error!',
                  text: verifyResponse.data.error || "Seat confirmation payment verification failed",
                  icon: 'error',
                  timer: 3000,
                  timerProgressBar: true
                });
              } catch (updateError) {
                console.error('Error updating failed seat confirmation payment status:', updateError);
                setError("Seat confirmation payment failed but status update failed. Please contact support.");
                Swal.fire({
                  title: 'Error!',
                  text: 'Seat confirmation payment failed but status update failed. Please contact support.',
                  icon: 'error',
                  timer: 3000,
                  timerProgressBar: true
                });
              }
            }
          } catch (error) {
            console.error("Seat confirmation payment verification error:", error);
            // Update payment status as failed for any error
            try {
              await axios.post('/payment/update', {
                phone: applicantData?.application?.phone,
                payment_id: response?.razorpay_payment_id,
                order_id: response?.razorpay_order_id,
                status: 'failed',
                type: 'seat',
                amount: orderAmount
              });
            } catch (updateError) {
              console.error('Error updating failed seat confirmation payment status:', updateError);
            }
            setError(error.response?.data?.error || "Seat confirmation payment verification failed");
            Swal.fire({
              title: 'Error!',
              text: error.response?.data?.error || "Seat confirmation payment verification failed",
              icon: 'error',
              timer: 3000,
              timerProgressBar: true
            });
          }
        },
        modal: {
          ondismiss: function() {
            console.log('Seat confirmation payment modal closed');
            setSeatPaymentLoading(false);
            // Update payment status as failed when modal is dismissed
            if (orderId) {
              axios.post('/payment/update', {
                phone: applicantData?.application?.phone,
                order_id: orderId,
                status: 'failed',
                type: 'seat'
              }).catch(error => {
                console.error('Error updating failed seat confirmation payment status:', error);
              });
            }
          },
          escape: false,
          handleback: true
        },
        retry: {
          enabled: true,
          max_count: 3
        },
        timeout: 900,
        theme: {
          color: "#3399cc"
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
    } catch (error) {
      console.error("Seat confirmation payment error:", error);
      setError(error.response?.data?.error || "Error processing seat confirmation payment");
      // Update payment status as failed for any error
      if (error.response?.data?.order_id) {
        try {
          await axios.post('/payment/update', {
            phone: applicantData?.application?.phone,
            order_id: error.response.data.order_id,
            status: 'failed',
            type: 'seat'
          });
        } catch (updateError) {
          console.error('Error updating failed seat confirmation payment status:', updateError);
        }
      }
    } finally {
      setSeatPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100 bg-light">
      
        <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
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
      
        <div className="container flex-grow-1 d-flex align-items-center justify-content-center">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header/>
      <div className="container flex-grow-1 py-4">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h2 className="h5 mb-0">Payment Details</h2>
              </div>
              <div className="card-body">
                {!formComplete ? (
                  <div className="alert alert-warning">
                    <h4 className="alert-heading">Application Form Incomplete</h4>
                    <p>Kindly complete your application form first to proceed with the payment.</p>
                    <hr />
                    <p className="mb-0">
                      Please ensure all sections (Personal Details, Qualification Details, and Documents) are completed.
                    </p>
                    <div className="mt-3">
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/registration')}
                      >
                        Complete Application Form
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="alert alert-info">
                      <h4 className="alert-heading">Application Form Complete!</h4>
                      <p>You can now proceed with the payment.</p>
                    </div>
                    {paymentCompleted ? (
                      <div className="alert alert-success">
                        <h4 className="alert-heading">Payment Completed</h4>
                        <p>Your payment has been processed successfully.</p>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <h5>Applicant Details:</h5>
                          <p><strong>Name:</strong> {applicantData?.application?.name || 'N/A'}</p>
                          <p><strong>Course:</strong> {applicantData?.application?.course || 'N/A'}</p>
                          <p><strong>Amount:</strong> Rs 750</p>
                        </div>
                        <button
                          className="btn btn-primary"
                          onClick={handlePayment}
                          disabled={loading || paymentCompleted}
                        >
                          {loading ? 'Processing...' : 'Pay Now'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seat Confirmation Payment Section */}
        {formComplete && (
          <div className="row justify-content-center mt-4">
            <div className="col-md-8">
              <div className="card shadow-sm">
                <div className="card-header bg-success text-white">
                  <h2 className="h5 mb-0">Seat Confirmation Payment</h2>
                </div>
                <div className="card-body">
                  {seatPaymentCompleted ? (
                    <div className="alert alert-success">
                      <h4 className="alert-heading">Payment Completed</h4>
                      <p><b>Congratulations!</b> Your seat confirmation payment has been processed successfully.</p>
                      <p><strong>Name:</strong> {applicantData?.application?.name || 'N/A'}</p>
                      <p><strong>Course:</strong> {applicantData?.application?.course || 'N/A'}</p>
                      <p><strong>Amount:</strong> Rs 10,000</p>
                    </div>
                  ) : (
                    <>
                      <div className="alert alert-info">
                        <h4 className="alert-heading">Confirm Your Seat!</h4>
                        <p>To confirm your admission, please pay the seat confirmation amount.</p>
                      </div>
                      <div className="mb-4">
                        <h5>Seat Confirmation Details:</h5>
                        <p><strong>Name:</strong> {applicantData?.application?.name || 'N/A'}</p>
                        <p><strong>Course:</strong> {applicantData?.application?.course || 'N/A'}</p>
                        <p><strong>Amount:</strong> Rs 10,000</p>
                      </div>
                      <button
                        className="btn btn-success"
                        onClick={handleSeatConfirmationPayment}
                        disabled={!paymentCompleted || seatPaymentCompleted}
                      >
                        {seatPaymentLoading ? 'Processing...' : 'Pay Now'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <footer className="bg-light text-center py-3 small text-muted border-top mt-auto">
        © {new Date().getFullYear()} LBSIMDS. All rights reserved.
      </footer>
    </div>
  );
};

export default Payment;
