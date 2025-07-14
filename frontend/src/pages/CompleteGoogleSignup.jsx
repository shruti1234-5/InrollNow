import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { Phone, Lock, Book } from 'lucide-react';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const CompleteGoogleSignup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    phone: '',
    course: ''
  });
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await axios.get(`/auth/check-auth`);
        if (!response.data.isAuthenticated) {
          navigate('/register');
        }
      } catch (error) {
        navigate('/register');
      }
    };
    checkAuth();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const sendOTP = async () => {
    if (!formData.phone) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please enter your phone number!',
        icon: 'warning',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    if (!/^\d{10}$/.test(formData.phone)) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please enter a valid 10-digit phone number!',
        icon: 'warning',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `91${formData.phone}`;
      await axios.post(`/send-whatsapp-otp`, { phone: formattedPhone });
      setOtpSent(true);
      Swal.fire({
        title: 'Success!',
        text: 'OTP has been sent to your WhatsApp!',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Failed to send OTP. Please try again.',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!otp) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please enter the OTP!',
        icon: 'warning',
        timer: 3000,
        timerProgressBar: true
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `91${formData.phone}`;
      await axios.post(`/verify-whatsapp-otp`, { phone: formattedPhone, otp });
      setVerified(true);
      Swal.fire({
        title: 'Success!',
        text: 'Phone number verified successfully!',
        icon: 'success',
        timer: 3000,
        timerProgressBar: true
      });
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: 'Invalid OTP. Please try again.',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setLoading(false);
  };

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword || !formData.phone || !formData.course) {
      Swal.fire({
        title: 'Warning!',
        text: 'All fields are required!',
        icon: 'warning',
        timer: 3000,
        timerProgressBar: true
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Swal.fire({
        title: 'Error!',
        text: 'Passwords do not match!',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
      return false;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!passwordRegex.test(formData.password)) {
      Swal.fire({
        title: 'Invalid Password!',
        text: 'Password must be at least 6 characters, contain one uppercase letter, one lowercase letter, one number, and one special character.',
        icon: 'error',
        timer: 6000,
        timerProgressBar: true
      });
      return false;
    }

    if (!verified) {
      Swal.fire({
        title: 'Warning!',
        text: 'Please verify your phone number first!',
        icon: 'warning',
        timer: 3000,
        timerProgressBar: true
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/auth/google/complete-signup`, {
        password: formData.password,
        phone: formData.phone,
        course: formData.course
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Registration completed successfully!',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true
        });
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      }
    } catch (error) {
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.error || 'Failed to complete registration',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setLoading(false);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />

      <div className="flex-grow-1 d-flex justify-content-center align-items-center px-4 py-2">
        <div className="bg-white rounded shadow-lg w-100 mx-auto p-2 p-md-3" style={{ maxWidth: "600px" }}>
          <div className="text-center mb-3">
            <h2 className="fs-5 fw-bold text-dark">Complete Your Registration</h2>
            <p className="text-muted mt-1">Please provide the following details to complete your registration</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="phone" className="form-label small fw-medium">Contact</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><Phone size={16} className="text-muted" /></span>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="form-control form-control-sm"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  pattern="\d{10}"
                  maxLength="10"
                  disabled={verified}
                />
                {!verified && (
                  <button
                    type="button"
                    className={`btn btn-sm ${otpSent ? 'btn-success' : 'btn-primary'}`}
                    onClick={sendOTP}
                    disabled={loading}
                  >
                    {loading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                )}
              </div>
            </div>

            {otpSent && !verified && (
              <div className="mb-3">
                <label htmlFor="otp" className="form-label small fw-medium">Enter OTP</label>
                <div className="input-group input-group-sm">
                  <input
                    id="otp"
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter OTP received on WhatsApp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={verifyOTP}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="course" className="form-label small fw-medium">Course</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><Book size={16} className="text-muted" /></span>
                <select
                  id="course"
                  name="course"
                  className="form-control form-control-sm"
                  value={formData.course}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a course</option>
                  <option value="MCA">MCA</option>
                  <option value="MBA">MBA</option>
                  <option value="BCA">BCA</option>
                  <option value="BBA">BBA</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label small fw-medium">Password</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><Lock size={16} className="text-muted" /></span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="form-control form-control-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label small fw-medium">Confirm Password</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><Lock size={16} className="text-muted" /></span>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  className="form-control form-control-sm"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 btn-sm"
              disabled={loading || !verified}
            >
              {loading ? 'Completing Registration...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteGoogleSignup; 