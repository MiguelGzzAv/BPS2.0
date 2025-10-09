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

        // If the user is a superadmin, they don't belong to a specific company's permission set
        // but have global permissions. Their permissions are fetched from the role-permissions endpoint.
        if (currentUser.is_superadmin) {
            // For superadmin, we can grant all page permissions on the frontend for simplicity,
            // as the backend is the ultimate guard.
            const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection', 'configuration', 'groups', 'messaging']);
            setPagePermissions(allPages);
        }

        try {
            // Fetch both page and role permissions concurrently.
            const [pagePermsRes, rolePermsRes] = await Promise.all([
                // Page permissions are tied to groups, which superadmin might not have.
                currentUser.is_superadmin ? Promise.resolve(null) : fetchWithAuth(`/api/permissions?companyId=${companyId}`),
                // Role permissions are fetched for the user's role_id.
                fetchWithAuth(`/api/role-permissions?companyId=${companyId}`)
            ]);

            // Handle Page Permissions
            if (pagePermsRes) {
                if (!pagePermsRes.ok) throw new Error('Failed to fetch page permissions.');
                const companyPagePermissions = await pagePermsRes.json();
                const userGroups = currentUser.groupIds || [];
                const allowedPages = new Set();
                userGroups.forEach(groupId => {
                    const groupPermissions = companyPagePermissions[String(groupId)] || [];
                    groupPermissions.forEach(page => allowedPages.add(page));
                });
                allowedPages.add('selection'); // All users can see the selection page
                setPagePermissions(allowedPages);
            }


            // Handle Action (CRUD) Permissions
            if (!rolePermsRes.ok) throw new Error('Failed to fetch role permissions.');
            const companyRolePermissions = await rolePermsRes.json();

            // Set the action permissions based on the current user's role_id.
            // The new user object from the login API contains `role_id`.
            setActionPermissions(companyRolePermissions[currentUser.role_id] || {});

        } catch (error) {
            console.error("Failed to load permissions:", error);
            // On failure, default to minimal permissions.
            setPagePermissions(new Set(['selection']));
            setActionPermissions({});
        }
    };

    useEffect(() => {
        const initAuth = async () => {
            // Fetch maintenance status on initial load
            await loadMaintenanceStatus();

            const storedUserJSON = localStorage.getItem('user');
            if (storedUserJSON) {
                const storedUser = JSON.parse(storedUserJSON);
                setUser(storedUser);
                const storedCompanyId = sessionStorage.getItem('selectedCompanyId');
                // Load permissions if a company was previously selected.
                if (storedCompanyId) {
                    await loadAllPermissions(storedUser, storedCompanyId);
                }
            }
        };
        initAuth();
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        // Reset permissions on login; they will be loaded upon company selection.
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
        // Load all permissions for the newly selected company.
        await loadAllPermissions(user, companyId);
    };

    // The 'can' function now relies solely on the actionPermissions state.
    // The special check for superadmin is removed, simplifying the logic.
    const can = (resource, action) => {
        // If the user is a superadmin, always return true.
        if (user?.is_superadmin) return true;
        // Otherwise, check the permissions object.
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