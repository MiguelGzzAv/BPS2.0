import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

const Processes = () => {
    const [processes, setProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const companyId = sessionStorage.getItem('selectedCompanyId');
                if (!companyId) {
                    setError('No company selected.');
                    setLoading(false);
                    return;
                }

                const response = await fetchWithAuth(`/api/processes?companyId=${companyId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch processes');
                }
                const data = await response.json();
                setProcesses(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProcesses();
    }, []);

    return (
        <>
            <h1 className="mb-4">Processes</h1>
            {loading && <p>Loading...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.map(process => (
                            <tr key={process.id}>
                                <td>{process.id}</td>
                                <td>{process.name}</td>
                                <td>{process.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Processes;