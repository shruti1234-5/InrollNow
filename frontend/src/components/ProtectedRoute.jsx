// import React from 'react';
// import { Navigate } from 'react-router-dom';

// const ProtectedRoute = ({ children }) => {
//   const userPhone = localStorage.getItem('userPhone');
  
//   if (!userPhone) {
//     // Redirect to login if not authenticated
//     return <Navigate to="/login" replace />;
//   }

//   return children;
// };

// export default ProtectedRoute; 


import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  if (!isAuthenticated) {
    // Redirect to register if not authenticated
    return <Navigate to="/register" replace />;
  }

  return children;
};

export default ProtectedRoute; 