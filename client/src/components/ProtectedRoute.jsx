import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from './MainLayout'; // Import the layout

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // If the user is not authenticated, redirect them to the login page.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the MainLayout. The MainLayout will then
  // render the appropriate child route via its own <Outlet />.
  return <MainLayout />;
};

export default ProtectedRoute;