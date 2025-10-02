import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

const Escalation = () => {
    const [escalations, setEscalations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEscalations = async () => {
            try {
                const companyId = sessionStorage.getItem('selectedCompanyId');
                if (!companyId) {
                    setError('No company selected.');
                    setLoading(false);
                    return;
                }

                const response = await fetchWithAuth(`/api/escalations?companyId=${companyId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch escalations');
                }
                const data = await response.json();
                setEscalations(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEscalations();
    }, []);

    return (
        <>
            <h1 className="mb-4">Escalation</h1>
            {loading && <p>Loading...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                 <p>No escalations found for this company.</p>
            )}
        </>
    );
};

export default Escalation;