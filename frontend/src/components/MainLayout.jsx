import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Navbar as BootstrapNavbar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import RegisterPage from '../pages/RegisterPage';
import RegistrationPage from '../pages/RegistrationPage';
import Dashboard from '../pages/Dashboard';
import Payment from '../pages/Payment';
import ReceiptPage from '../pages/ReceiptPage';
import ProtectedRoute from './ProtectedRoute';

function MainLayout() {
  const location = useLocation();
  const { isAuthenticated, loading, checkAuth } = useAuth();
  const isRegisterPage = location.pathname === "/register";

  // Only enable sidebar toggle if it's NOT an Auth Page
  const [isCollapsed, setIsCollapsed] = useState(isRegisterPage ? true : window.innerWidth < 992);
  const [isMobile, setIsMobile] = useState(isRegisterPage ? false : window.innerWidth < 992);

  useEffect(() => {
    checkAuth();
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (isRegisterPage) return; // Skip event listeners on register page

    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 992);
      setIsMobile(window.innerWidth < 992);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isRegisterPage]);

  const handleToggle = () => {
    if (!isRegisterPage) {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated and not on the register page, redirect to register
  if (!isAuthenticated && !isRegisterPage && location.pathname !== "/") {
    return <Navigate to="/register" state={{ from: location }} replace />;
  }

  // If authenticated and on the register page, redirect to dashboard
  if (isAuthenticated && isRegisterPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="d-flex">
      {!isRegisterPage && (
        <Navbar
          isCollapsed={isCollapsed}
          isMobile={isMobile}
          onToggle={handleToggle}
        />
      )}
      <div
        className={`flex-grow-1 ${!isRegisterPage ? 'content-wrapper' : ''}`}
        style={
          !isRegisterPage
            ? {
                marginLeft: isMobile ? 0 : 268, // Sidebar width
                transition: 'margin-left 0.2s',
                minHeight: '100vh',
                background: '#f8f9fa',
              }
            : { minHeight: '100vh', background: '#f8f9fa' }
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/register" replace />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/registration"
            element={
              <ProtectedRoute>
                <RegistrationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <Payment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt"
            element={
              <ProtectedRoute>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default MainLayout; 