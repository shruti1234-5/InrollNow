import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Header from "../components/Header";
import { GraduationCap, User, Mail, Lock, Book, Phone, Info } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

// Set axios base URL and default config
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    course: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [googleId, setGoogleId] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have Google data in URL params
    const googleName = searchParams.get('name');
    const googleEmail = searchParams.get('email');
    const id = searchParams.get('googleId');
    const phoneParam = searchParams.get('phone');
    const courseParam = searchParams.get('course');

    if (googleName && googleEmail && id) {
      setFormData({ ...formData, name: googleName, email: googleEmail, phone: phoneParam, course: courseParam });
      setGoogleId(id);
      setIsGoogleUser(true);
    } else {
      setIsGoogleUser(false); // Not completing Google signup, show initial view
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate phone number format (10 digits)
      if (!/^\d{10}$/.test(formData.phone)) {
        Swal.fire({
          title: 'Warning!',
          text: 'Please enter a valid 10-digit phone number!',
          icon: 'warning',
          timer: 3000,
          timerProgressBar: true
        });
        setLoading(false);
        return;
      }
      
      // Register user without OTP verification
      const response = await axios.post('/registration/register', {
        ...formData,
        phone: formData.phone // Send 10-digit number without country code
      });

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Registration successful!',
          icon: 'success',
          timer: 3000,
          timerProgressBar: true
        });
        navigate('/login');
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Registration failed',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }
    setLoading(false);
  };

  const handleGoogleSignUp = async (credentialResponse) => {
    try {
      // Send credential to backend for verification and user check
      const response = await axios.post('/auth/google/register', {
        credential: credentialResponse.credential,
        fromLogin: false // Indicate signup flow
      });

      console.log('Backend /auth/google/register response:', response.data); // Debug log

      if (response.data.success) {
        if (response.data.isRegistered) {
          // User is already registered - log them in and redirect to dashboard
          console.log('User already registered. Logging in and redirecting to dashboard.');
          if (response.data.user) {
            // Set authentication state using user data from backend response
            localStorage.setItem('userPhone', response.data.user.phone);
            localStorage.setItem('userEmail', response.data.user.email);
            localStorage.setItem('isAuthenticated', 'true');
            // Redirect to dashboard immediately after setting auth state
            navigate('/dashboard', { replace: true });
          } else {
            // Backend indicated registered but didn't return user info - unexpected
            console.error('Backend error: isRegistered is true, but user info is missing in /auth/google/register response.');
            Swal.fire({
              title: 'Error!',
              text: 'Could not retrieve user information. Please try logging in directly.',
              icon: 'error',
              timer: 3000,
              timerProgressBar: true
            }).then(() => {
              navigate('/login', { replace: true });
            });
          }
        } else { // isRegistered is false - New User
          console.log('New Google user. Proceeding to registration completion.');

          // Decode the Google credential to get user information
          const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
          const { name, email, sub: googleId } = decodedToken;

          // Set the user information in state
          setFormData({ ...formData, name, email, phone: '', course: '', googleId });
          setGoogleId(googleId);
          setIsGoogleUser(true);

          // Show success message
          Swal.fire({
            title: 'Success!',
            text: 'Please complete your registration by providing your phone number and selecting your course.',
            icon: 'success',
            timer: 3000,
            timerProgressBar: true
          });
        }
      } else {
        // Handle cases where success is false from backend /auth/google/register
        console.error('Backend /auth/google/register failed:', response.data.message || response.data.error);
        Swal.fire({
          title: 'Error!',
          text: response.data.message || response.data.error || 'Google sign-up process failed.',
          icon: 'error',
          timer: 3000,
          timerProgressBar: true
        });
      }
    } catch (error) {
      console.error('Google sign-up error (catch block):', error);
      // Handle network errors or other exceptions during the API call
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.error || error.message || 'Failed to connect to the server during Google sign-up. Please try again.',
        icon: 'error',
        showConfirmButton: true,
        timer: 3000,
        timerProgressBar: true
      });
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Header />

      <div className="flex-grow-1 d-flex justify-content-center align-items-center px-4 py-2">
        <div className="bg-white rounded shadow-lg w-100 mx-auto p-2 p-md-3" style={{ maxWidth: "600px" }}>
          <div className="text-center mb-3">
            <div className="d-inline-flex p-2 text-primary mb-2">
              {/* <GraduationCap size={28} /> */}
              <img
                src="/download.png"
                alt="Logo"
                style={{ width: 160, height: 120 }}
              />
            </div>
            {!isGoogleUser && (
              <>
                {/* <h3 className="fw-bold mb-3">Welcome </h3> */}
                <h2 className="h4 fw-bold mb-3">Student Admission Portal</h2>
<p className="text-muted">
  New students can register and existing students can log in using their Google account.
</p>
                {/* <p className="text-muted">Please sign up to continue</p> */}
                <div className="d-flex justify-content-center mb-3">
                  <GoogleLogin
                    onSuccess={handleGoogleSignUp}
                    onError={() => {
                      Swal.fire({
                        title: 'Error!',
                        text: 'Google sign-up failed. Please try again.',
                        icon: 'error',
                        timer: 3000,
                        timerProgressBar: true
                      });
                    }}
                    useOneTap={false}
                    theme="outline"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                  />
                </div>
              </>
            )}
          </div>

          {isGoogleUser && (
            <>
              {/* Show alert for Google users completing signup */}
              <div className="alert alert-info mb-4">
                <h5 className="alert-heading">Please complete your registration by providing your mobile number and selecting your preferred course.</h5>
              </div>

              {/* Show the form only for Google signup completion */}
              <form onSubmit={handleSubmit}>
                {/* Name Field */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label small fw-medium">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><User size={16} className="text-muted" /></span>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="form-control form-control-sm"
                      placeholder="Enter your full name"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label small fw-medium">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Mail size={16} className="text-muted" /></span>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="form-control form-control-sm"
                      placeholder="Enter your email address"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label small fw-medium">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Phone size={16} className="text-muted" /></span>
                    <input
                      id="phone"
                      type="tel"
                      className="form-control form-control-sm"
                      placeholder="Enter 10-digit phone number"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                      pattern="\d{10}"
                      maxLength="10"
                    />
                  </div>
                </div>

                {/* Course Field */}
                <div className="mb-3">
                  <label htmlFor="course" className="form-label small fw-medium">
                    Course <span className="text-danger">*</span>
                  </label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text"><Book size={16} className="text-muted" /></span>
                    <select
                      id="course"
                      className="form-control form-control-sm"
                      required
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    >
                      <option value="">Select a course</option>
                      <option value="BBA (Girls Only)">BBA (Girls Only)</option>
                      <option value="BCA (Girls Only)">BCA (Girls Only)</option>
                      <option value="B.Com (Girls Only)">B.Com (Girls Only)</option>
                      <option value="B.Com (H) (Girls Only)">B.Com (H) (Girls Only)</option>
                      <option value="M.Com (Girls Only)">M.Com (Girls Only)</option>
                      <option value="BBA (Co-Ed)">BBA (Co-Ed)</option>
                      <option value="BCA (Co-Ed)">BCA (Co-Ed)</option>
                      <option value="MCA (Co-Ed)">MCA (Co-Ed)</option>
                      <option value="MBA (Co-Ed)">MBA (Co-Ed)</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 btn-sm"
                  disabled={loading}
                >
                  Complete Registration
                </button>
              </form>
            </>
          )}

          {/* <div className="text-center mt-3">
            <p className="mb-0">
              Already have an account?{" "}
              <Link to="/login" className="text-primary text-decoration-none">
                Sign in
              </Link>
            </p>
          </div> */}
        </div>
      </div>

      <footer className="bg-light py-3 text-center text-muted small">
        © {new Date().getFullYear()} LBSIMDS. All rights reserved.
      </footer>
    </div>
  );
};

export default RegisterPage;