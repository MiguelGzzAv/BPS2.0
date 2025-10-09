import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

function MainLayout() {
    const { user, logout, pagePermissions } = useAuth();
    const navigate = useNavigate();
    const companyName = sessionStorage.getItem('selectedCompanyName');
    const [latestMessage, setLatestMessage] = useState(null);
    const [lastShownMessageId, setLastShownMessageId] = useState(null);

    // Effect to fetch the latest message periodically
    useEffect(() => {
        if (!user) return; // Don't fetch if not logged in

        const fetchMessage = async () => {
            try {
                const response = await fetchWithAuth('/api/messaging/latest');
                if (!response.ok) return;

                const message = await response.json();
                // Show message if it exists and hasn't been shown/dismissed before
                if (message && message.id !== lastShownMessageId) {
                    setLatestMessage(message);
                }
            } catch (error) {
                console.error('Failed to fetch global message:', error);
            }
        };

        fetchMessage(); // Initial fetch
        const intervalId = setInterval(fetchMessage, 30000); // Poll every 30 seconds

        return () => clearInterval(intervalId);
    }, [user, lastShownMessageId]);

    // Effect to display the toast when a new message arrives
    useEffect(() => {
        if (latestMessage) {
            const toastElement = document.getElementById('globalToast');
            if (toastElement) {
                const toast = bootstrap.Toast.getOrCreateInstance(toastElement);

                const onHidden = () => {
                    // When the toast is dismissed, mark it as "shown"
                    setLastShownMessageId(latestMessage.id);
                };

                toastElement.addEventListener('hidden.bs.toast', onHidden, { once: true });
                toast.show();
            }
        }
    }, [latestMessage]);

    useEffect(() => {
        if (!companyName) {
            console.warn("No company selected, redirecting to /selection");
            navigate('/selection');
        }
    }, [companyName, navigate]);

    const handleLinkClick = () => {
        const offcanvasElement = document.getElementById('offcanvasMenu');
        if (offcanvasElement) {
            try {
                const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                if (bsOffcanvas) {
                    bsOffcanvas.hide();
                }
            } catch (e) {
                console.error("Could not hide offcanvas. Make sure Bootstrap's JS is loaded.", e);
            }
        }
    };

    return (
        <div className="d-flex flex-column vh-100">
            {/* Top Navbar */}
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark shadow-sm">
                <div className="container-fluid">
                    <button className="btn btn-outline-light me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <a className="navbar-brand" href="/selection">
                        BPS 2.0
                    </a>
                    <div className="ms-auto d-flex align-items-center">
                        <span className="navbar-text me-3 text-white-50">
                            Company: {companyName || 'N/A'}
                        </span>
                        <div className="dropdown">
                            <button className="btn btn-outline-light dropdown-toggle" type="button" id="userMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                                {user?.name || 'User'}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
                                <li><NavLink className="dropdown-item" to="/profile">My Profile</NavLink></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button onClick={logout} className="dropdown-item text-danger">Logout</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Offcanvas Menu */}
            <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="offcanvasMenu">
                <div className="offcanvas-header border-bottom border-secondary">
                    <h5 className="offcanvas-title">Menu - {companyName || 'No Company'}</h5>
                    <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <ul className="nav nav-pills flex-column mb-auto">
                        {pagePermissions.has('dashboard') && (
                            <li className="nav-item">
                                <NavLink to="/dashboard" className="nav-link text-white" onClick={handleLinkClick}>Dashboard</NavLink>
                            </li>
                        )}
                        {pagePermissions.has('users') && (
                            <li>
                                <NavLink to="/users" className="nav-link text-white" onClick={handleLinkClick}>Users & Groups</NavLink>
                            </li>
                        )}
                        {pagePermissions.has('selection') && (
                             <li>
                                <NavLink to="/selection" className="nav-link text-white" onClick={handleLinkClick}>Companies</NavLink>
                            </li>
                        )}
                        {pagePermissions.has('processes') && (
                            <li>
                                <NavLink to="/processes" className="nav-link text-white" onClick={handleLinkClick}>Processes</NavLink>
                            </li>
                        )}
                        {pagePermissions.has('monitoring') && (
                            <li>
                                <NavLink to="/monitoring" className="nav-link text-white" onClick={handleLinkClick}>Monitoring</NavLink>
                            </li>
                        )}
                        {pagePermissions.has('escalation') && (
                            <li>
                                <NavLink to="/escalation" className="nav-link text-white" onClick={handleLinkClick}>Escalation</NavLink>
                            </li>
                        )}
                        {user?.role === 'superadmin' && (
                            <>
                                <hr className="border-secondary" />
                                <li className="nav-item dropdown">
                                    <a className="nav-link dropdown-toggle text-white" href="#" id="configDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                        Configuration
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-dark" aria-labelledby="configDropdown">
                                        <li><NavLink to="/configuration/companies" className="dropdown-item" onClick={handleLinkClick}>Companies</NavLink></li>
                                        <li><NavLink to="/configuration/roles" className="dropdown-item" onClick={handleLinkClick}>System Roles</NavLink></li>
                                        <li><NavLink to="/configuration/maintenance" className="dropdown-item" onClick={handleLinkClick}>Maintenance</NavLink></li>
                                        <li><NavLink to="/configuration/database" className="dropdown-item" onClick={handleLinkClick}>Database</NavLink></li>
                                    </ul>
                                </li>
                                <li>
                                    <NavLink to="/messaging" className="nav-link text-white" onClick={handleLinkClick}>Messaging</NavLink>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container-fluid page-container flex-grow-1">
                <Outlet />
            </main>

            {/* Global Toast Container */}
            <div className="toast-container position-fixed top-0 end-0 p-3">
                {latestMessage && (
                    <div id="globalToast" className="toast" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
                        <div className="toast-header">
                            <i className="bi bi-broadcast rounded me-2"></i>
                            <strong className="me-auto">Global Broadcast</strong>
                            <small>{new Date(latestMessage.timestamp).toLocaleTimeString()}</small>
                            <button type="button" className="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                        <div className="toast-body">
                            {latestMessage.text}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MainLayout;