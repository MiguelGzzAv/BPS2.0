import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchWithAuth } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userPermissions, setUserPermissions] = useState(new Set());

    const loadUserPermissions = async (currentUser, companyId) => {
        if (!currentUser || !companyId) {
            setUserPermissions(new Set());
            return;
        }

        // Superadmins have all permissions by default
        if (currentUser.role === 'superadmin') {
            const allPages = new Set(['dashboard', 'users', 'processes', 'monitoring', 'escalation', 'selection']);
            setUserPermissions(allPages);
            return;
        }

        try {
            const permsRes = await fetchWithAuth(`/api/permissions?companyId=${companyId}`);
            if (!permsRes.ok) throw new Error('Failed to fetch permissions.');
            const companyPermissions = await permsRes.json();

            const userGroups = currentUser.groupIds || [];
            const allowedPages = new Set();
            userGroups.forEach(groupId => {
                // Ensure groupId is a string for object key access, as JSON keys are strings
                const groupPermissions = companyPermissions[String(groupId)] || [];
                groupPermissions.forEach(page => allowedPages.add(page));
            });

            allowedPages.add('selection'); // Always allow access to the company selection page
            setUserPermissions(allowedPages);
        } catch (error) {
            console.error("Failed to load user permissions:", error);
            setUserPermissions(new Set(['selection'])); // Default to minimal permissions on error
        }
    };

    // On initial load, check for user and company to load permissions
    useEffect(() => {
        const storedUserJSON = localStorage.getItem('user');
        if (storedUserJSON) {
            const storedUser = JSON.parse(storedUserJSON);
            setUser(storedUser);
            const storedCompanyId = sessionStorage.getItem('selectedCompanyId');
            if (storedCompanyId) {
                loadUserPermissions(storedUser, storedCompanyId);
            }
        }
    }, []);

    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setUserPermissions(new Set()); // Clear old permissions
    };

    const logout = () => {
        localStorage.removeItem('user');
        sessionStorage.removeItem('selectedCompanyId');
        sessionStorage.removeItem('selectedCompanyName');
        setUser(null);
        setUserPermissions(new Set());
    };

    const selectCompany = (companyId, companyName) => {
        sessionStorage.setItem('selectedCompanyId', companyId);
        sessionStorage.setItem('selectedCompanyName', companyName);
        loadUserPermissions(user, companyId);
    };

    const value = {
        user,
        login,
        logout,
        selectCompany,
        userPermissions,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};