import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
    const { logout } = useAuth();
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
        <div>
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
                            <NavLink to="/dashboard" className="nav-link text-white" onClick={handleLinkClick}>Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink to="/users" className="nav-link text-white" onClick={handleLinkClick}>Users</NavLink>
                        </li>
                        <li>
                            <NavLink to="/selection" className="nav-link text-white" onClick={handleLinkClick}>Companies</NavLink>
                        </li>
                        <li>
                            <NavLink to="/departments" className="nav-link text-white" onClick={handleLinkClick}>Departments</NavLink>
                        </li>
                        <li>
                            <NavLink to="/processes" className="nav-link text-white" onClick={handleLinkClick}>Processes</NavLink>
                        </li>
                        <li>
                            <NavLink to="/monitoring" className="nav-link text-white" onClick={handleLinkClick}>Monitoring</NavLink>
                        </li>
                        <li>
                            <NavLink to="/escalation" className="nav-link text-white" onClick={handleLinkClick}>Escalation</NavLink>
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