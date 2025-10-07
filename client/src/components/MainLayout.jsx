import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
    const { user, logout, pagePermissions } = useAuth();
    const navigate = useNavigate();
    const companyName = sessionStorage.getItem('selectedCompanyName');

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
                    </ul>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container-fluid page-container flex-grow-1">
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;