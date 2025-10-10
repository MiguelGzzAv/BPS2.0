import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Selection from './pages/Selection';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Processes from './pages/Processes';
import Monitoring from './pages/Monitoring';
import Escalation from './pages/Escalation';
import Configuration from './pages/Configuration';
import Messaging from './pages/Messaging';
import RolePermissionsManagement from './components/RolePermissionsManagement'; // Corrected path
import Maintenance from './pages/Maintenance';

// A wrapper to handle maintenance mode for each page
const MaintenanceWrapper = ({ children, pageName }) => {
    const { maintenanceStatus } = useAuth();
    if (maintenanceStatus[pageName]) {
        return <Maintenance pageName={pageName} />;
    }
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<MaintenanceWrapper pageName="dashboard"><Dashboard /></MaintenanceWrapper>} />
                        <Route path="selection" element={<Selection />} />
                        <Route path="users" element={<MaintenanceWrapper pageName="users"><Users /></MaintenanceWrapper>} />
                        <Route path="processes" element={<MaintenanceWrapper pageName="processes"><Processes /></MaintenanceWrapper>} />
                        <Route path="monitoring" element={<MaintenanceWrapper pageName="monitoring"><Monitoring /></MaintenanceWrapper>} />
                        <Route path="escalation" element={<MaintenanceWrapper pageName="escalation"><Escalation /></MaintenanceWrapper>} />
                        <Route path="configuration" element={<Configuration />} />
                        <Route path="messaging" element={<Messaging />} />
                        {/* Example of a route that might be part of the configuration page */}
                        <Route path="configuration/role-permissions" element={<RolePermissionsManagement />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;