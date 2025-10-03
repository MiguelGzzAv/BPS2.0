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
        const offcanvasElement = document.getElementById('demo');
        if (offcanvasElement) {
            // This requires Bootstrap's JavaScript to be loaded.
            // Assuming it is, we try to get the instance and hide it.
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
            {/* Top Navbar from user example */}
            <nav className="navbar navbar-expand-sm bg-dark navbar-dark">
                <div className="container-fluid">
                    <a className="navbar-brand" href="#">
                        <img
                            src="https://www.w3schools.com/bootstrap5/img/logo.svg"
                            alt="Logo"
                            style={{width: '40px'}}
                            className="rounded-pill"
                        />
                    </a>
                    {/* Button to open the offcanvas sidebar */}
                    <button className="btn btn-primary" type="button" data-bs-toggle="offcanvas" data-bs-target="#demo">
                        Open Menu
                    </button>
                    <div className="ms-auto">
                        <button onClick={logout} className="btn btn-outline-danger">Logout</button>
                    </div>
                </div>
            </nav>

            {/* Offcanvas Sidebar from user example */}
            <div className="offcanvas offcanvas-start" id="demo">
                <div className="offcanvas-header">
                    <h1 className="offcanvas-title">Menu</h1>
                    <button type="button" className="btn-close text-reset" data-bs-dismiss="offcanvas"></button>
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
                            <NavLink to="/escalation" className="nav-link" onClick={handleLinkClick}>Escalation</NavLink>
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