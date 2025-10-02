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
        return <div>Loading...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Welcome, {auth.user.name}!</h1>
                <button onClick={auth.logout}>Logout</button>
            </header>

            <h2 style={{ marginTop: '30px' }}>Company Selection</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '20px' }}>
                {companies.map(company => (
                    <div key={company.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', width: '200px' }}>
                        <h3>{company.name}</h3>
                        <button onClick={() => handleSelectCompany(company)}>
                            Access Dashboard
                        </button>
                    </div>
                ))}
            </div>

            {auth.user.role === 'superadmin' && (
                <div style={{ marginTop: '30px' }}>
                    <h3>Admin Controls</h3>
                    <button>Add Company</button>
                    <button style={{ marginLeft: '10px' }} disabled>Edit Company</button>
                    <button style={{ marginLeft: '10px' }} disabled>Delete Company</button>
                </div>
            )}
        </div>
    );
}

export default Selection;