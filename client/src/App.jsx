import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Processes from './pages/Processes';
import Departments from './pages/Departments';
import Groups from './pages/Groups';
import Monitoring from './pages/Monitoring';
import Escalation from './pages/Escalation';
import ConfirmSelection from './pages/ConfirmSelection';
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
        <Route path="/processes" element={<Processes />} />
        <Route path="/departments" element={<Departments />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/monitoring" element={<Monitoring />} />
        <Route path="/escalation" element={<Escalation />} />
        <Route path="/confirm-selection" element={<ConfirmSelection />} />
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