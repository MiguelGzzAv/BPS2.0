import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ConfirmSelection = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedCompany, setSelectedCompany] = useState(null);

    useEffect(() => {
        // This page is only for superadmins
        if (user && user.role !== 'superadmin') {
            navigate('/dashboard');
            return;
        }

        const companyId = sessionStorage.getItem('selectedCompanyId');
        const companyName = sessionStorage.getItem('selectedCompanyName');

        if (!companyId || !companyName) {
            // If no company is selected, go back to the selection page
            navigate('/selection');
        } else {
            setSelectedCompany({ id: companyId, name: companyName });
        }
    }, [user, navigate]);

    const handleConfirm = () => {
        // On confirmation, proceed to the dashboard
        navigate('/dashboard');
    };

    const handleGoBack = () => {
        // Clear the selection and go back
        sessionStorage.removeItem('selectedCompanyId');
        sessionStorage.removeItem('selectedCompanyName');
        navigate('/selection');
    };

    if (!selectedCompany) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    return (
        <div className="container page-container text-center" style={{ maxWidth: '600px' }}>
            <h2>Confirm Selection</h2>
            <p className="lead text-muted">You are about to access the dashboard for the following company:</p>

            <div className="card my-4">
                <div className="card-body">
                    <h3 className="card-title">{selectedCompany.name}</h3>
                </div>
            </div>

            <p>Please confirm that you want to proceed.</p>

            <div className="d-flex justify-content-center gap-3 mt-4">
                <button onClick={handleGoBack} className="btn btn-secondary">
                    Go Back
                </button>
                <button onClick={handleConfirm} className="btn btn-primary">
                    Confirm and Continue
                </button>
            </div>
        </div>
    );
};

export default ConfirmSelection;