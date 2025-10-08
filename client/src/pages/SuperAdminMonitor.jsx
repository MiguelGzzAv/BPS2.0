import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

function SuperAdminMonitor() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await fetchWithAuth('/api/audit-logs');
                if (!response.ok) {
                    throw new Error('Failed to fetch audit logs. You must be a superadmin to view this page.');
                }
                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const renderDetails = (details) => {
        return Object.entries(details).map(([key, value]) => (
            <div key={key}><small><strong>{key}:</strong> {JSON.stringify(value)}</small></div>
        ));
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div className="container-fluid">
            <h1 className="mb-4">Superadmin Audit Log</h1>
            <p>This page shows a log of important changes made across the system.</p>

            <div className="table-responsive">
                <table className="table table-striped table-hover">
                    <thead className="table-dark">
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? logs.map(log => (
                            <tr key={log.id}>
                                <td>{new Date(log.timestamp).toLocaleString()}</td>
                                <td>{log.userName} (ID: {log.userId})</td>
                                <td><span className="badge bg-primary">{log.action}</span></td>
                                <td>{renderDetails(log.details)}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="text-center">No audit logs found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default SuperAdminMonitor;