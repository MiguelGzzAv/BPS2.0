import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchWithAuth } from '../api';

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
                    <h4>Database Connection</h4>
                    <p>Manage database connection details. (This is a visual placeholder and is not functional).</p>
                    <div className="row">
                        <div className="col-md-6">
                            <form>
                                <div className="mb-3">
                                    <label htmlFor="db-host" className="form-label">Host</label>
                                    <input type="text" id="db-host" className="form-control" value="localhost" disabled />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="db-port" className="form-label">Port</label>
                                    <input type="text" id="db-port" className="form-control" value="5432" disabled />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="db-user" className="form-label">Username</label>
                                    <input type="text" id="db-user" className="form-control" value="admin" disabled />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="db-pass" className="form-label">Password</label>
                                    <input type="password" id="db-pass" className="form-control" value="********" disabled />
                                </div>
                                <button type="submit" className="btn btn-primary me-2" disabled>Save Connection</button>
                                <button type="button" className="btn btn-secondary" disabled>Test Connection</button>
                            </form>
                        </div>
                    </div>
                </div>
                <div className="tab-pane fade" id="maintenance" role="tabpanel" aria-labelledby="maintenance-tab">
                    <MaintenanceModeSettings />
                </div>
            </div>
        </div>
    );
}

export default Configuration;