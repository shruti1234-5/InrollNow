import React, { useState, useEffect } from 'react';
import './App.css';
import RegisterPage from './pages/RegisterPage';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import RegistrationPage from "./pages/RegistrationPage";
import ProtectedRoute from './components/ProtectedRoute';
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard';
// import LoginPage from './pages/LoginPage';
import { Navbar as BootstrapNavbar } from 'react-bootstrap';
import ReceiptPage from './pages/ReceiptPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';

// Configure axios defaults
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.post['Content-Type'] = 'application/json';

// Add request interceptor
axios.interceptors.request.use(
  config => {
    // Add timestamp to prevent caching
    config.params = { ...config.params, _t: Date.now() };
    // Ensure credentials are included
    config.withCredentials = true;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle CORS errors
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 0) {
      // Handle CORS error
      console.error('CORS Error:', error);
      return Promise.reject({
        message: 'Network Error: Unable to connect to the server. Please check your internet connection.',
        originalError: error
      });
    }
    return Promise.reject(error);
  }
);

const App = () => {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

function MainLayout() {
  const location = useLocation();
  const isRegisterPage = location.pathname === "/register";
  const isLoginPage = location.pathname === "/login";
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // If not authenticated and not on the register or login page, redirect to login
  if (!isAuthenticated && !isRegisterPage && !isLoginPage && location.pathname !== "/") {
    return <Navigate to="/login" replace />;
  }

  // If authenticated and on the login/register page, redirect to dashboard
  if (isAuthenticated && (isLoginPage || isRegisterPage)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Only enable sidebar toggle if it's NOT an Auth Page
  const [isCollapsed, setIsCollapsed] = useState(isRegisterPage || isLoginPage ? true : window.innerWidth < 992);
  const [isMobile, setIsMobile] = useState(isRegisterPage || isLoginPage ? false : window.innerWidth < 992);

  useEffect(() => {
    if (isRegisterPage || isLoginPage) return; // Skip event listeners on auth pages

    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 992);
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRegisterPage, isLoginPage]);

  const handleToggle = () => {
    if (!isRegisterPage && !isLoginPage) {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="App" style={{ display: "flex", minHeight: "100vh" }}>
      {/* Toggle Button - Only visible on mobile & NOT on Register/Login pages */}
      {!isRegisterPage && !isLoginPage && isMobile && (
        <button
          onClick={handleToggle}
          style={{
            position: "fixed",
            top: "15px",
            left: "15px",
            zIndex: 1100,
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            padding: "10px 15px",
            cursor: "pointer",
            borderRadius: "5px",
            fontSize: "18px",
          }}
        >
          ☰
        </button>
      )}

      {/* Overlay when Sidebar is Open on Mobile */}
      {!isRegisterPage && !isLoginPage && isMobile && !isCollapsed && (
        <div
          onClick={handleToggle}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
          }}
        ></div>
      )}

      {/* Sidebar - Hidden on Register/Login pages */}
      {!isRegisterPage && !isLoginPage && (
        <div
          style={{
            width: isMobile ? (isCollapsed ? "0" : "268px") : "268px",
            backgroundColor: "#f8f9fa",
            minHeight: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            overflowY: "hidden",
            transition: "width 0.3s ease",
            zIndex: isMobile ? 1050 : 1,
            boxShadow: isCollapsed ? "none" : "2px 0px 5px rgba(0,0,0,0.1)",
          }}
        >
          <BootstrapNavbar
            expand="lg"
            bg="light"
            variant="light"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              backgroundColor: "#fff",
              zIndex: 1050,
              margin: 0,
              padding: 0,
            }}
          >
            <BootstrapNavbar.Collapse id="navbar-nav" in={!isCollapsed}>
              <div>
                <Navbar onNavClick={() => setIsCollapsed(true)} />
              </div>
            </BootstrapNavbar.Collapse>
          </BootstrapNavbar>
        </div>
      )}

      {/* Main Content */}
      <div
        style={{
          width: isRegisterPage || isLoginPage ? "100%" : isMobile ? "100%" : "calc(100% - 268px)",
          marginLeft: isRegisterPage || isLoginPage ? "0" : isMobile ? "0" : "268px",
          paddingLeft: isRegisterPage || isLoginPage ? "0" : "20px",
          minHeight: "100vh",
          overflowY: "auto",
          transition: "margin-left 0.3s ease",
        }}
      >
        <Routes>
          {/* <Route path="/login" element={<LoginPage />} /> */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/registration" element={<ProtectedRoute><RegistrationPage /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/receipt" element={<ReceiptPage />} />
          <Route path="/download-form" element={
            <ProtectedRoute>
              <div className="p-4">
                <h2>Download Registration Form</h2>
                <p>Form download functionality coming soon...</p>
              </div>
            </ProtectedRoute>
          } />
        
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/register"} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/register"} replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;

