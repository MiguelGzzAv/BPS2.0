import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // If the user is not authenticated, redirect them to the login page.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the child route's component.
  // The <Outlet /> component from react-router-dom is a placeholder that
  // renders the actual page component matched by the route.
  return <Outlet />;
};

export default ProtectedRoute;