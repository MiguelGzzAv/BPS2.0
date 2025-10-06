import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

// Define the resources and the actions that can be performed on them
const RESOURCES = {
    users: ['create', 'read', 'update', 'delete'],
    groups: ['create', 'read', 'update', 'delete'],
    processes: ['create', 'read', 'update', 'delete'],
    permissions: ['read', 'update'],
    registrations: ['create', 'read', 'update', 'delete'],
};

// Define the roles that can be managed
const MANAGED_ROLES = ['admin', 'operator', 'reader'];

const RolePermissionsManagement = () => {
    const { user } = useAuth();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const companyId = sessionStorage.getItem('selectedCompanyId');

    const fetchData = useCallback(async () => {
        if (!companyId) {
            setError("Please select a company first.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetchWithAuth(`/api/role-permissions?companyId=${companyId}`);
            if (!response.ok) throw new Error('Failed to fetch role permissions.');
            const data = await response.json();
            setPermissions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePermissionChange = (role, resource, action) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev)); // Deep copy
            if (!newPermissions[role]) newPermissions[role] = {};
            if (!newPermissions[role][resource]) newPermissions[role][resource] = {};

            newPermissions[role][resource][action] = !newPermissions[role][resource][action];

            return newPermissions;
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const response = await fetchWithAuth('/api/role-permissions', {
                method: 'POST',
                body: {
                    companyId,
                    ...permissions
                },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save role permissions.');
            }
            alert('Role permissions saved successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const canManage = user.role === 'admin' || user.role === 'superadmin';

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h2>Role Action Permissions</h2>
                {canManage && (
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save All Role Permissions'}
                    </button>
                )}
            </header>
            <p className="text-muted">
                Define what actions each role can perform on different resources. This provides granular control over user capabilities.
            </p>

            <div className="row">
                {MANAGED_ROLES.map(role => (
                    <div key={role} className="col-md-12 mb-4">
                        <div className="card">
                            <div className="card-header text-capitalize">
                                <h3>{role}</h3>
                            </div>
                            <div className="card-body">
                                <table className="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Resource</th>
                                            {Object.values(RESOURCES)[0].map(action => (
                                                <th key={action} className="text-center text-capitalize">{action}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(RESOURCES).map(resource => (
                                            <tr key={resource}>
                                                <td className="text-capitalize">{resource}</td>
                                                {RESOURCES[resource].map(action => (
                                                    <td key={action} className="text-center">
                                                        <div className="form-check d-flex justify-content-center">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={permissions[role]?.[resource]?.[action] || false}
                                                                onChange={() => handlePermissionChange(role, resource, action)}
                                                                disabled={!canManage}
                                                            />
                                                        </div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RolePermissionsManagement;