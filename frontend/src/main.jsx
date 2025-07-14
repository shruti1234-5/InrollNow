import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'
import './index.css'

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

console.log('VITE_GOOGLE_CLIENT_ID at runtime:', GOOGLE_CLIENT_ID);
console.log('VITE_API_BASE_URL at runtime:', API_BASE_URL);

// Validate required environment variables
if (!GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is not set');
}

if (!API_BASE_URL) {
  console.error('VITE_API_BASE_URL is not set');
}

// Add error boundary for module loading issues
window.addEventListener('error', (event) => {
  console.error('Script loading error:', event);
});

// Ensure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadSuccess={() => console.log('Google OAuth script loaded successfully with clientId:', GOOGLE_CLIENT_ID)}
      onScriptLoadError={(error) => console.error('Google OAuth script failed to load:', error)}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
