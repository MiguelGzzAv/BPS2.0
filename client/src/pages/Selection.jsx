import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import CompanyFormModal from '../components/CompanyFormModal';
import AccessConfirmModal from '../components/AccessConfirmModal';

function Selection() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [error, setError] = useState('');

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

    const fetchCompanies = async () => {
        try {
            setError('');
            const response = await fetchWithAuth('/api/companies');
            if (!response.ok) throw new Error('Failed to fetch companies');
            const data = await response.json();
            setCompanies(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (auth.isAuthenticated) {
            fetchCompanies();
        }
    }, [auth.isAuthenticated]);

    const handleCardClick = (company) => {
        setSelectedCompany(company);
        // For superadmins, show confirmation modal. For others, navigate directly.
        if (auth.user.role === 'superadmin') {
            setIsAccessModalOpen(true);
        } else {
            handleConfirmAccess(company);
        }
    };

    const handleConfirmAccess = (companyToAccess) => {
        const company = companyToAccess || selectedCompany;
        if (!company) return;
        sessionStorage.setItem('selectedCompanyId', company.id);
        sessionStorage.setItem('selectedCompanyName', company.name);
        navigate('/dashboard');
    };

    const handleSaveCompany = async (companyData) => {
        const isEditing = !!selectedCompany;
        const url = isEditing ? `/api/companies/${selectedCompany.id}` : '/api/companies';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify(companyData),
            });
            if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'add'} company`);

            await fetchCompanies();
            setIsFormModalOpen(false);
            setSelectedCompany(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteCompany = async () => {
        if (!selectedCompany) {
            setError('Please select a company to delete.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete ${selectedCompany.name}?`)) {
            try {
                const response = await fetchWithAuth(`/api/companies/${selectedCompany.id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete company');

                await fetchCompanies();
                setSelectedCompany(null);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (!auth.user) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    return (
        <>
            <CompanyFormModal
                show={isFormModalOpen}
                onHide={() => setIsFormModalOpen(false)}
                onSave={handleSaveCompany}
                company={selectedCompany}
            />
            <AccessConfirmModal
                show={isAccessModalOpen}
                onHide={() => setIsAccessModalOpen(false)}
                onConfirm={() => handleConfirmAccess(selectedCompany)}
                companyName={selectedCompany?.name}
            />

            <div className="container page-container">
                <div className="p-5 mb-4 bg-light rounded-3">
                    <div className="container-fluid py-5">
                        <h1 className="display-5 fw-bold">Welcome, {auth.user.name}!</h1>
                        <p className="col-md-8 fs-4">Select a company to manage its dashboard or use the admin controls to manage companies.</p>
                        <button onClick={auth.logout} className="btn btn-outline-secondary btn-lg">Logout</button>
                    </div>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h2>Companies</h2>
                    {auth.user.role === 'superadmin' && (
                        <div>
                            <button onClick={() => { setSelectedCompany(null); setIsFormModalOpen(true); }} className="btn btn-success">Add</button>
                            <button onClick={() => setIsFormModalOpen(true)} className="btn btn-warning ms-2" disabled={!selectedCompany}>Edit</button>
                            <button onClick={handleDeleteCompany} className="btn btn-danger ms-2" disabled={!selectedCompany}>Delete</button>
                        </div>
                    )}
                </div>

                <div className="row">
                    {companies.map(company => (
                        <div className="col-md-4 mb-4" key={company.id}>
                            <div
                                className={`card ${selectedCompany?.id === company.id ? 'border-primary' : ''}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCardClick(company)}
                            >
                                <div className="card-body text-center">
                                    <h5 className="card-title">{company.name}</h5>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Selection;