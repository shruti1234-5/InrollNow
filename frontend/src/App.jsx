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
import MainLayout from './components/MainLayout';
import { AuthProvider } from './context/AuthContext';

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
    <AuthProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

