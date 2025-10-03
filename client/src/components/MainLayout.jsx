import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const companyName = sessionStorage.getItem('selectedCompanyName');
    const isCompanySelected = !!companyName;

    useEffect(() => {
        // If no company is selected and we are not on the selection page, redirect.
        if (!isCompanySelected && location.pathname !== '/selection') {
            console.warn("No company selected, redirecting to /selection");
            navigate('/selection');
        }
    }, [isCompanySelected, navigate, location.pathname]);

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
        <div>
            {/* Top Navbar */}
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark shadow-sm">
                <div className="container-fluid">
                    <button className="btn btn-outline-light me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu" aria-label="Open navigation menu">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <a className="navbar-brand" href="/selection">
                        BPS 2.0
                    </a>
                    <div className="ms-auto d-flex align-items-center">
                        <span className="navbar-text me-3 text-white-50">
                            Company: {companyName || 'N/A'}
                        </span>
                        <button onClick={logout} className="btn btn-outline-danger">Logout</button>
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
                        <li className="nav-item">
                            <NavLink to="/dashboard" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Dashboard</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/users" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Users</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/selection" className="nav-link text-white" onClick={handleLinkClick}>Companies</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/departments" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Departments</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/processes" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Processes</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/monitoring" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Monitoring</NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/escalation" className={`nav-link text-white ${!isCompanySelected ? 'disabled' : ''}`} onClick={isCompanySelected ? handleLinkClick : (e) => e.preventDefault()}>Escalation</NavLink>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="container page-container">
                <Outlet />
            </main>
        </div>
    );
}

export default MainLayout;