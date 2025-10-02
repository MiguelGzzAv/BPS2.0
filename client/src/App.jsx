import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users'; // Import the Users component
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* If the user is authenticated and tries to go to /login, redirect them to the selection page */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/selection" replace /> : <Login />}
      />

      {/* All routes inside ProtectedRoute require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/selection" element={<Selection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
      </Route>

      {/* Default route handler */}
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? "/selection" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;