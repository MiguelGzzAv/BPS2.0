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
            const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection']);
            setPagePermissions(allPages);
            // Superadmin can do everything
            setActionPermissions({
                users: { create: true, read: true, update: true, delete: true },
                groups: { create: true, read: true, update: true, delete: true },
                processes: { create: true, read: true, update: true, delete: true },
                permissions: { read: true, update: true },
                registrations: { create: true, read: true, update: true, delete: true },
            });
            return;
        }

        try {
            const [pagePermsRes, rolePermsRes] = await Promise.all([
                fetchWithAuth(`/api/permissions?companyId=${companyId}`),
                fetchWithAuth(`/api/role-permissions?companyId=${companyId}`)
            ]);

            if (!pagePermsRes.ok) throw new Error('Failed to fetch page permissions.');
            if (!rolePermsRes.ok) throw new Error('Failed to fetch role permissions.');

            const companyPagePermissions = await pagePermsRes.json();
            const companyRolePermissions = await rolePermsRes.json();

            // Calculate page permissions
            const userGroups = currentUser.groupIds || [];
            const allowedPages = new Set();
            userGroups.forEach(groupId => {
                const groupPermissions = companyPagePermissions[String(groupId)] || [];
                groupPermissions.forEach(page => allowedPages.add(page));
            });
            allowedPages.add('selection');
            setPagePermissions(allowedPages);

            // Set action permissions for the user's role
            setActionPermissions(companyRolePermissions[currentUser.role] || {});

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