import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

const RESOURCES = {
    users: ['create', 'read', 'update', 'delete'],
    groups: ['create', 'read', 'update', 'delete'],
    processes: ['create', 'read', 'update', 'delete'],
    permissions: ['read', 'update'],
    registrations: ['create', 'read', 'update', 'delete'],
};

const AVAILABLE_PAGES = [
    'dashboard', 'users', 'processes', 'monitoring', 'escalation', 'permissions', 'messaging', 'maintenance'
];

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

    const handleActionPermissionChange = (role, resource, action) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            if (!newPermissions[role]) newPermissions[role] = { pages: [] };
            if (!newPermissions[role][resource]) newPermissions[role][resource] = {};
            newPermissions[role][resource][action] = !newPermissions[role][resource][action];
            return newPermissions;
        });
    };

    const handlePagePermissionChange = (role, page) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            if (!newPermissions[role]) newPermissions[role] = { pages: [] };
            const pageIndex = newPermissions[role].pages.indexOf(page);
            if (pageIndex > -1) {
                newPermissions[role].pages.splice(pageIndex, 1);
            } else {
                newPermissions[role].pages.push(page);
            }
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
                    permissions,
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
                <h2>Role Permissions</h2>
                {canManage && (
                    <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save All Permissions'}
                    </button>
                )}
            </header>
            <p className="text-muted">
                Define what actions each role can perform (API access) and which pages they are allowed to see (UI visibility).
            </p>

            <div className="row">
                {MANAGED_ROLES.map(role => (
                    <div key={role} className="col-md-12 mb-4">
                        <div className="card">
                            <div className="card-header text-capitalize">
                                <h3>{role}</h3>
                            </div>
                            <div className="card-body">
                                {/* Page Permissions */}
                                <h5 className="mt-2">Page Access</h5>
                                <div className="d-flex flex-wrap border rounded p-2 mb-4">
                                    {AVAILABLE_PAGES.map(page => (
                                        <div key={page} className="form-check form-check-inline me-4">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`page-${role}-${page}`}
                                                checked={permissions[role]?.pages?.includes(page) || false}
                                                onChange={() => handlePagePermissionChange(role, page)}
                                                disabled={!canManage}
                                            />
                                            <label className="form-check-label text-capitalize" htmlFor={`page-${role}-${page}`}>{page}</label>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Permissions */}
                                <h5 className="mt-4">Action Permissions</h5>
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
                                                                onChange={() => handleActionPermissionChange(role, resource, action)}
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