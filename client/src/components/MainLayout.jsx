import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function MainLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Attempt to get company name from sessionStorage
    const companyName = sessionStorage.getItem('selectedCompanyName');

    // If no company is selected, redirect to the selection page
    useEffect(() => {
        if (!companyName) {
            console.warn("No company selected, redirecting to /selection");
            navigate('/selection');
        }
    }, [companyName, navigate]);


    // This function will be used to close the offcanvas menu when a link is clicked
    const handleLinkClick = () => {
        const offcanvasElement = document.getElementById('offcanvasMenu');
        if (offcanvasElement) {
            const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
            if (bsOffcanvas) {
                bsOffcanvas.hide();
            }
        }
    };

    return (
        <div>
            {/* Top Navbar */}
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
                <div className="container-fluid">
                    <button className="btn btn-outline-light me-2" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasMenu">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <a className="navbar-brand" href="#">
                        BPS 2.0
                    </a>
                    <div className="ms-auto">
                        <span className="navbar-text me-3 text-white">
                            Company: {companyName || 'N/A'}
                        </span>
                        <button onClick={logout} className="btn btn-outline-danger">Logout</button>
                    </div>
                </div>
            </nav>

            {/* Offcanvas Menu */}
            <div className="offcanvas offcanvas-start bg-dark text-white" tabIndex="-1" id="offcanvasMenu">
                <div className="offcanvas-header">
                    <h5 className="offcanvas-title">Menu - {companyName || 'No Company'}</h5>
                    <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div className="offcanvas-body">
                    <ul className="nav nav-pills flex-column mb-auto">
                        <li className="nav-item">
                            <NavLink to="/dashboard" className="nav-link" onClick={handleLinkClick}>Dashboard</NavLink>
                        </li>
                        <li>
                            <NavLink to="/users" className="nav-link" onClick={handleLinkClick}>Users</NavLink>
                        </li>
                        <li>
                            <NavLink to="/selection" className="nav-link" onClick={handleLinkClick}>Companies</NavLink>
                        </li>
                        <li>
                            <NavLink to="/departments" className="nav-link" onClick={handleLinkClick}>Departments</NavLink>
                        </li>
                        <li>
                            <NavLink to="/processes" className="nav-link" onClick={handleLinkClick}>Processes</NavLink>
                        </li>
                        <li>
                            <NavLink to="/monitoring" className="nav-link" onClick={handleLinkClick}>Monitoring</NavLink>
                        </li>
                        <li>
                            <NavLink to="/escalation" className="nav-link text-white" onClick={handleLinkClick}>Escalation</NavLink>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="container-fluid">
                    {/* The Outlet component renders the matched child route component */}
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default MainLayout;