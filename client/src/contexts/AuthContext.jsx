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
            const res = await fetch('/api/maintenance');
            if (res.ok) {
                const data = await res.json();
                setMaintenanceStatus(data);
            } else {
                console.error("Could not load maintenance status:", res.statusText);
            }
        } catch (error) {
            console.error("Failed to fetch maintenance status:", error);
        }
    };

    const loadAllPermissions = async (currentUser, companyId) => {
        if (!currentUser || !companyId) {
            setPagePermissions(new Set());
            setActionPermissions({});
            return;
        }

        // This logic is for regular users when they select a company.
        // Superadmin permissions are handled at login.
        try {
            const [pagePermsRes, rolePermsRes] = await Promise.all([
                fetchWithAuth(`/api/permissions?companyId=${companyId}`),
                fetchWithAuth(`/api/role-permissions?companyId=${companyId}`)
            ]);

            if (pagePermsRes) {
                if (!pagePermsRes.ok) throw new Error('Failed to fetch page permissions.');
                const companyPagePermissions = await pagePermsRes.json();
                const userGroups = currentUser.groupIds || [];
                const allowedPages = new Set();
                userGroups.forEach(groupId => {
                    const groupPermissions = companyPagePermissions[String(groupId)] || [];
                    groupPermissions.forEach(page => allowedPages.add(page));
                });
                allowedPages.add('selection');
                setPagePermissions(allowedPages);
            }

            if (!rolePermsRes.ok) throw new Error('Failed to fetch role permissions.');
            const companyRolePermissions = await rolePermsRes.json();
            setActionPermissions(companyRolePermissions[currentUser.role_id] || {});

        } catch (error) {
            console.error("Failed to load permissions:", error);
            setPagePermissions(new Set(['selection']));
            setActionPermissions({});
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            await loadMaintenanceStatus();
            const storedUserJSON = localStorage.getItem('user');
            if (storedUserJSON) {
                const storedUser = JSON.parse(storedUserJSON);
                setUser(storedUser);
                // On initial load, if user is superadmin, grant all permissions.
                if (storedUser.is_superadmin) {
                    const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection', 'configuration', 'groups', 'messaging']);
                    setPagePermissions(allPages);
                } else {
                    const storedCompanyId = sessionStorage.getItem('selectedCompanyId');
                    if (storedCompanyId) {
                        await loadAllPermissions(storedUser, storedCompanyId);
                    }
                }
            }
        };
        initAuth();
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);

        // If the user is a superadmin, grant all page permissions immediately on login.
        // This ensures the UI (nav links, etc.) renders correctly without needing to select a company.
        if (userData.is_superadmin) {
            const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection', 'configuration', 'groups', 'messaging']);
            setPagePermissions(allPages);
            setActionPermissions({}); // Superadmin `can()` check doesn't use this.
        } else {
            // For regular users, reset permissions. They will be loaded on company selection.
            setPagePermissions(new Set());
            setActionPermissions({});
        }
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
        await loadAllPermissions(user, companyId);
    };

    const can = (resource, action) => {
        if (user?.is_superadmin) return true;
        return actionPermissions[resource]?.[action] === true;
    };

    const value = {
        user,
        login,
        logout,
        selectCompany,
        pagePermissions,
        can,
        isAuthenticated: !!user,
        maintenanceStatus,
        loadMaintenanceStatus,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};