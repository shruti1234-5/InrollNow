import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import axios from 'axios';
import Swal from 'sweetalert2';
import Header from '../components/Header';
import { GraduationCap } from 'lucide-react';

// Set axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const LoginPage = () => {
    const navigate = useNavigate();

    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const response = await axios.post('/auth/google/register', {
                credential: credentialResponse.credential,
                fromLogin: true
            });

            if (response.data.success) {
                if (response.data.redirect) {
                    // If user needs to complete registration
                    Swal.fire({
                        title: 'Account Not Found',
                        text: 'Please register first before logging in.',
                        icon: 'warning',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    }).then(() => {
                        window.location.href = response.data.redirect;
                    });
                } else {
                    // Successful login
                    localStorage.setItem('userPhone', response.data.user.phone);
                    localStorage.setItem('userEmail', response.data.user.email);
                    localStorage.setItem('isAuthenticated', 'true');
                    
                    Swal.fire({
                        title: 'Success!',
                        text: 'Login successful!',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    }).then(() => {
                        navigate('/dashboard', { replace: true });
                    });
                }
            }
        } catch (error) {
            console.error('Google login error:', error);
            Swal.fire({
                title: 'Error!',
                text: error.response?.data?.error || 'Failed to login. Please try again.',
                icon: 'error',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
        }
    };

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <Header />
            <div className="flex-grow-1 d-flex justify-content-center align-items-center px-4 py-5">
                <div className="bg-white rounded shadow-lg p-4 p-md-5" style={{ maxWidth: "400px", width: "100%" }}>
                    <div className="text-center mb-4">
                        <div className="d-inline-flex p-3 rounded-circle bg-primary bg-opacity-10 text-primary mb-3">
                            <GraduationCap size={32} />
                        </div>
                        <h2 className="h4 fw-bold mb-3">Welcome Back!</h2>
                        <p className="text-muted">Please sign in to continue</p>
                    </div>

                    <div className="d-flex justify-content-center mt-4">
  <GoogleLogin
    onSuccess={handleGoogleLogin}
    onError={() => {
      Swal.fire({
        title: 'Error!',
        text: 'Google login failed. Please try again.',
        icon: 'error',
        timer: 3000,
        timerProgressBar: true
      });
    }}
    useOneTap={false}
    theme="outline"
    size="large"
    text="signin_with"
    shape="rectangular"
    context="signin"
  />
</div>

                    <div className="text-center mt-3">
                        <p className="mb-0">
                                Don't have an account?{" "}
                            <Link to="/register" className="text-primary text-decoration-none">
                                    Sign up
                                </Link>
                            </p>
                    </div>
                </div>
            </div>
            <footer className="bg-light py-3 text-center text-muted small">
                © {new Date().getFullYear()} LBSIMDS. All rights reserved.
            </footer>
        </div>
    );
};

export default LoginPage;

