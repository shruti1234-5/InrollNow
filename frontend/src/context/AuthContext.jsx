import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create axios instance with credentials
  const authAxios = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const checkAuth = useCallback(async () => {
    try {
      const response = await authAxios.get('/auth/check-auth');
      console.log('Auth check response:', response.data);
      
      if (response.data.isAuthenticated && response.data.user) {
        setIsAuthenticated(true);
        setUser(response.data.user);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        localStorage.setItem('userPhone', response.data.user.phone);
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('isAuthenticated', 'true');
        return true;
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('userData');
        localStorage.removeItem('userPhone');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAuthenticated');
        return false;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth status on mount and when needed
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (userData) => {
    try {
      setIsAuthenticated(true);
      setUser(userData);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('userPhone', userData.phone);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authAxios.post('/auth/logout');
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('userData');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated,
      user,
      loading,
      login,
      logout,
      checkAuth,
      authAxios
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 