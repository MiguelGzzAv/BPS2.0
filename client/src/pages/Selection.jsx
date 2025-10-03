import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { fetchWithAuth } from '../api';

function Selection() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadCompanies = async () => {
            try {
                const response = await fetchWithAuth('/api/companies');
                if (!response.ok) {
                    throw new Error('Failed to fetch companies');
                }
                const data = await response.json();
                setCompanies(data);
            } catch (err) {
                setError('Failed to load companies.');
                console.error(err);
            }
        };

        if (auth.isAuthenticated) {
            loadCompanies();
        }
    }, [auth.isAuthenticated]);

    const handleSelectCompany = (company) => {
        sessionStorage.setItem('selectedCompanyId', company.id);
        sessionStorage.setItem('selectedCompanyName', company.name);
        navigate('/dashboard'); // Navigate to the dashboard
    };

    if (!auth.user) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    return (
        <div className="container page-container">
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h1>Welcome, {auth.user.name}!</h1>
                <button onClick={auth.logout} className="btn btn-outline-secondary">Logout</button>
            </header>

            <div className="text-center">
                <h2>Company Selection</h2>
                <p className="text-muted">Please select a company to proceed to the dashboard.</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="selection-grid">
                {companies.map(company => (
                    <div key={company.id} className="company-card">
                        {/* Placeholder for company logo */}
                        <img
                            src={`https://ui-avatars.com/api/?name=${company.name.replace(' ', '+')}&background=0D6EFD&color=fff&size=100`}
                            alt={`${company.name} Logo`}
                            className="company-card-logo rounded-circle"
                        />
                        <h5 className="card-title mt-3">{company.name}</h5>
                        <button onClick={() => handleSelectCompany(company)} className="btn btn-primary">
                            Select
                        </button>
                    </div>
                ))}
            </div>

            {auth.user.role === 'superadmin' && (
                <div className="mt-5 p-4 bg-light rounded border">
                    <h4>Admin Controls</h4>
                    <p className="text-muted small">Manage companies in the system.</p>
                    <button className="btn btn-success">Add Company</button>
                    <button className="btn btn-secondary ms-2" disabled>Edit Company</button>
                    <button className="btn btn-secondary ms-2" disabled>Delete Company</button>
                </div>
            )}
        </div>
    );
}

export default Selection;