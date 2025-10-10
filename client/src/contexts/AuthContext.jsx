import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchWithAuth } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [pagePermissions, setPagePermissions] = useState(new Set());
    const [actionPermissions, setActionPermissions] = useState({});
    const [maintenanceStatus, setMaintenanceStatus] = useState({});

    const loadMaintenanceStatus = async () => {
        try {
            const res = await fetchWithAuth('/api/maintenance');
            if (res.ok) {
                const data = await res.json();
                setMaintenanceStatus(data);
            }
        } catch (error) {
            console.error("Failed to load maintenance status:", error);
        }
    };

    const loadAllPermissions = async (currentUser, companyId) => {
        if (!currentUser || !companyId) {
            setPagePermissions(new Set());
            setActionPermissions({});
            return;
        }

        if (currentUser.role === 'superadmin') {
            const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection', 'configuration', 'messaging']);
            setPagePermissions(allPages);
            // Superadmin can do everything (this is also handled by the backend, but good for optimistic UI)
            setActionPermissions({ /* ... full permissions ... */ });
            return;
        }

        try {
            const res = await fetchWithAuth(`/api/role-permissions?companyId=${companyId}`);
            if (!res.ok) throw new Error('Failed to fetch permissions.');

            const allRolePermissions = await res.json();
            const userRolePermissions = allRolePermissions[currentUser.role];

            if (userRolePermissions) {
                // Page permissions are now part of the role permissions object
                const allowedPages = new Set(userRolePermissions.pages || []);
                allowedPages.add('selection'); // All users should see the company selection
                setPagePermissions(allowedPages);

                // Action permissions are the rest of the object
                const { pages, ...actions } = userRolePermissions;
                setActionPermissions(actions);
            } else {
                 // If no permissions are defined for the role, set empty permissions
                setPagePermissions(new Set(['selection']));
                setActionPermissions({});
            }

        } catch (error) {
            console.error("Failed to load permissions:", error);
            setPagePermissions(new Set(['selection']));
            setActionPermissions({});
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            const storedUserJSON = localStorage.getItem('user');
            if (storedUserJSON) {
                // If user is already logged in, load everything
                const storedUser = JSON.parse(storedUserJSON);
                setUser(storedUser);
                await loadMaintenanceStatus(); // Load status for logged-in user
                const storedCompanyId = sessionStorage.getItem('selectedCompanyId');
                if (storedCompanyId) {
                    await loadAllPermissions(storedUser, storedCompanyId);
                }
            }
        };
        initAuth();
    }, []);

    const login = async (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // After a successful login, load the maintenance status
        await loadMaintenanceStatus();
        setPagePermissions(new Set());
        setActionPermissions({});
    };

    const logout = () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('selectedCompanyId');
        sessionStorage.removeItem('selectedCompanyName');
        setUser(null);
        setPagePermissions(new Set());
        setActionPermissions({});
    };

    const selectCompany = async (companyId, companyName) => {
        sessionStorage.setItem('selectedCompanyId', companyId);
        sessionStorage.setItem('selectedCompanyName', companyName);
        // Wait for all permissions to be loaded before proceeding.
        await loadAllPermissions(user, companyId);
    };

    const can = (resource, action) => {
        if (user?.role === 'superadmin') return true;
        return actionPermissions[resource]?.[action] === true;
    };

    const value = {
        user,
        login,
        logout,
        selectCompany,
        pagePermissions,
        can, // Expose the 'can' function
        isAuthenticated: !!user,
        maintenanceStatus,
        loadMaintenanceStatus, // Expose the function to reload status if needed
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};