import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';

function DatabaseConnectionSettings() {
    const [dbStatus, setDbStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTesting, setIsTesting] = useState(false);
    const [error, setError] = useState(null);

    const fetchDbStatus = async () => {
        try {
            const response = await fetchWithAuth('/api/database/status');
            const data = await response.json();
            setDbStatus(data);
            if (!response.ok) {
                setError(data.error || 'Failed to connect to the database.');
            } else {
                setError(null);
            }
        } catch (err) {
            setError('An unexpected network error occurred while fetching the status.');
            setDbStatus(null); // Clear previous status on network error
        }
    };

    useEffect(() => {
        const initialFetch = async () => {
            setIsLoading(true);
            await fetchDbStatus();
            setIsLoading(false);
        };
        initialFetch();
    }, []);

    const handleTestConnection = async () => {
        setIsTesting(true);
        await fetchDbStatus();
        setIsTesting(false);
    };

    if (isLoading) {
        return <p>Checking database connection...</p>;
    }

    if (!dbStatus) {
        return <div className="alert alert-danger">Error: {error}</div>;
    }

    const config = dbStatus.connected ? dbStatus : dbStatus.details;

    return (
        <div>
            <h4>Database Connection</h4>
            <p>Live status of the database connection configured for the application.</p>

            <div className="mt-3">
                <div className="mb-3 d-flex align-items-center">
                    <strong className="me-2">Status:</strong>
                    {dbStatus.connected ? (
                        <span className="badge bg-success fs-6">Connected</span>
                    ) : (
                        <span className="badge bg-danger fs-6">Disconnected</span>
                    )}
                    <button
                        className="btn btn-sm btn-secondary ms-3"
                        onClick={handleTestConnection}
                        disabled={isTesting}
                    >
                        {isTesting ? 'Testing...' : 'Test Connection Again'}
                    </button>
                </div>

                {!dbStatus.connected && (
                    <div className="alert alert-warning">
                        <p className="mb-0"><strong>Error:</strong> {error || 'Could not connect to the database.'} Please check the server logs and ensure the database container is running correctly.</p>
                    </div>
                )}

                <div className="row mt-4">
                    <div className="col-md-6">
                        <h5>Configuration Details</h5>
                        <p className="text-muted small">These values are read from the environment variables on the server.</p>
                        <form>
                            <div className="mb-3">
                                <label htmlFor="db-host" className="form-label">Host</label>
                                <input type="text" id="db-host" className="form-control" value={config?.host || 'N/A'} disabled />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="db-port" className="form-label">Port</label>
                                <input type="text" id="db-port" className="form-control" value={config?.port || 'N/A'} disabled />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="db-user" className="form-label">Username</label>
                                <input type="text" id="db-user" className="form-control" value={config?.user || 'N/A'} disabled />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="db-name" className="form-label">Database Name</label>
                                <input type="text" id="db-name" className="form-control" value={config?.database || 'N/A'} disabled />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MaintenanceModeSettings() {
    const [status, setStatus] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                setIsLoading(true);
                const response = await fetchWithAuth('/api/maintenance');
                if (!response.ok) {
                    throw new Error('Failed to fetch maintenance status.');
                }
                const data = await response.json();
                setStatus(data);
                setError(null);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleToggle = (page) => {
        setStatus(prevStatus => ({
            ...prevStatus,
            [page]: !prevStatus[page]
        }));
    };

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            const response = await fetchWithAuth('/api/maintenance', {
                method: 'POST',
                body: status,
            });
            if (!response.ok) {
                throw new Error('Failed to save changes.');
            }
            // Optionally, show a success message to the user
            alert('Settings saved successfully!');
        } catch (err) {
            setError(err.message);
            alert('Error saving settings.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <p>Loading settings...</p>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div>
            <h4>Maintenance Mode</h4>
            <p>Activate maintenance mode for specific pages. When active, users will see a maintenance notice instead of the page content.</p>
            <div className="list-group">
                {Object.keys(status).map(page => (
                    <div key={page} className="list-group-item d-flex justify-content-between align-items-center">
                        <span className="text-capitalize">{page}</span>
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`switch-${page}`}
                                checked={status[page]}
                                onChange={() => handleToggle(page)}
                                disabled={isSaving}
                            />
                            <label className="form-check-label" htmlFor={`switch-${page}`}>
                                {status[page] ? 'Active' : 'Inactive'}
                            </label>
                        </div>
                    </div>
                ))}
            </div>
            <button
                className="btn btn-primary mt-3"
                onClick={handleSaveChanges}
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}


function Configuration() {
    const { user } = useAuth();

    // This is an extra layer of protection.
    // The main protection is in the route and the nav link.
    if (user?.role !== 'superadmin') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="container-fluid mt-4">
            <h2>System Configuration</h2>
            <p>Manage system-wide settings from here. This page is only accessible to Super Admins.</p>

            <ul className="nav nav-tabs mt-4" id="configTabs" role="tablist">
                <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="timezone-tab" data-bs-toggle="tab" data-bs-target="#timezone" type="button" role="tab" aria-controls="timezone" aria-selected="true">Timezone</button>
                </li>
                <li className="nav-item" role="presentation">
                    <button className="nav-link" id="db-connection-tab" data-bs-toggle="tab" data-bs-target="#db-connection" type="button" role="tab" aria-controls="db-connection" aria-selected="false">Database Connection</button>
                </li>
                <li className="nav-item" role="presentation">
                    <button className="nav-link" id="maintenance-tab" data-bs-toggle="tab" data-bs-target="#maintenance" type="button" role="tab" aria-controls="maintenance" aria-selected="false">Maintenance Mode</button>
                </li>
            </ul>

            <div className="tab-content pt-3" id="configTabsContent">
                <div className="tab-pane fade show active" id="timezone" role="tabpanel" aria-labelledby="timezone-tab">
                    <h4>Timezone Settings</h4>
                    <p>Configure the application's default timezone. (This is a visual placeholder and is not functional).</p>
                    <div className="row">
                        <div className="col-md-6">
                            <label htmlFor="timezone-select" className="form-label">Select Timezone</label>
                            <select id="timezone-select" className="form-select" disabled>
                                <option>UTC-08:00 Pacific Time (US & Canada)</option>
                                <option>UTC-06:00 Central Time (US & Canada)</option>
                                <option>UTC+01:00 Central European Time</option>
                            </select>
                            <button className="btn btn-primary mt-3" disabled>Save Timezone</button>
                        </div>
                    </div>
                </div>
                <div className="tab-pane fade" id="db-connection" role="tabpanel" aria-labelledby="db-connection-tab">
                    <DatabaseConnectionSettings />
                </div>
                <div className="tab-pane fade" id="maintenance" role="tabpanel" aria-labelledby="maintenance-tab">
                    <MaintenanceModeSettings />
                </div>
            </div>
        </div>
    );
}

export default Configuration;