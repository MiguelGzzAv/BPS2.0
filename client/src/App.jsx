import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Processes from './pages/Processes';
import Groups from './pages/Groups';
import Monitoring from './pages/Monitoring';
import Escalation from './pages/Escalation';
import Profile from './pages/Profile';
import SuperAdminMonitor from './pages/SuperAdminMonitor';
import Configuration from './pages/Configuration';
import Maintenance from './pages/Maintenance';
import Messaging from './pages/Messaging';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { isAuthenticated, user, maintenanceStatus } = useAuth();

  // A wrapper to protect routes with maintenance mode
  const MaintenanceWrapper = ({ pageName, children }) => {
    // Superadmin can always access pages, even in maintenance mode
    if (user?.role !== 'superadmin' && maintenanceStatus[pageName]) {
      return <Maintenance />;
    }
    return children;
  };

  return (
    <Routes>
      {/* If the user is authenticated and tries to go to /login, redirect them to the selection page */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/selection" replace /> : <Login />}
      />

      {/* All routes inside ProtectedRoute require authentication */}
      <Route element={<ProtectedRoute />}>
        {/* These pages are not under maintenance mode */}
        <Route path="/selection" element={<Selection />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/configuration" element={<Configuration />} />
        <Route path="/messaging" element={<Messaging />} />
        <Route path="/superadmin-monitoring" element={<SuperAdminMonitor />} />

        {/* These pages can be under maintenance */}
        <Route path="/dashboard" element={<MaintenanceWrapper pageName="dashboard"><Dashboard /></MaintenanceWrapper>} />
        <Route path="/users" element={<MaintenanceWrapper pageName="users"><Users /></MaintenanceWrapper>} />
        <Route path="/processes" element={<MaintenanceWrapper pageName="processes"><Processes /></MaintenanceWrapper>} />
        <Route path="/groups" element={<MaintenanceWrapper pageName="groups"><Groups /></MaintenanceWrapper>} />
        <Route path="/monitoring" element={<MaintenanceWrapper pageName="monitoring"><Monitoring /></MaintenanceWrapper>} />
        <Route path="/escalation" element={<MaintenanceWrapper pageName="escalation"><Escalation /></MaintenanceWrapper>} />
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