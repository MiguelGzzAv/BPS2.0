import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the AuthProvider component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    // On initial load, check if user data exists in localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    // Login function: updates user state and stores it in localStorage
    const login = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    // Logout function: clears user state and localStorage
    const logout = () => {
        localStorage.removeItem('user');
        // Also clear selected company from sessionStorage for a clean logout
        sessionStorage.removeItem('selectedCompanyId');
        sessionStorage.removeItem('selectedCompanyName');
        setUser(null);
    };

    // The value provided to consuming components
    const value = {
        user,
        login,
        logout,
        isAuthenticated: !!user, // A handy boolean to check if logged in
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook for easy access to the context
export const useAuth = () => {
    return useContext(AuthContext);
};