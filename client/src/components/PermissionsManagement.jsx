import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

const AVAILABLE_PAGES = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'users', name: 'Users & Groups' },
    { id: 'processes', name: 'Processes' },
    { id: 'monitoring', name: 'Monitoring' },
    { id: 'escalation', name: 'Escalation' },
];

const PermissionsManagement = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState([]);
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
            const [groupsRes, permsRes] = await Promise.all([
                fetchWithAuth(`/api/groups?companyId=${companyId}`),
                fetchWithAuth(`/api/permissions?companyId=${companyId}`)
            ]);

            if (!groupsRes.ok) throw new Error('Failed to fetch groups.');
            if (!permsRes.ok) throw new Error('Failed to fetch permissions.');

            const groupsData = await groupsRes.json();
            const permsData = await permsRes.json();

            setGroups(groupsData);
            setPermissions(permsData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePermissionChange = (groupId, pageId) => {
        setPermissions(prev => {
            const groupPermissions = prev[groupId] ? [...prev[groupId]] : [];
            const pageIndex = groupPermissions.indexOf(pageId);

            if (pageIndex > -1) {
                // Page is currently allowed, so remove it
                groupPermissions.splice(pageIndex, 1);
            } else {
                // Page is not allowed, so add it
                groupPermissions.push(pageId);
            }
            return { ...prev, [groupId]: groupPermissions };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const response = await fetchWithAuth('/api/permissions', {
                method: 'POST',
                body: {
                    companyId,
                    ...permissions
                },
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save permissions.');
            }
            alert('Permissions saved successfully!');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const canManagePermissions = user.role === 'admin' || user.role === 'superadmin';

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h2>Group Page Permissions</h2>
                {canManagePermissions && (
                     <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Permissions'}
                    </button>
                )}
            </header>

            <p className="text-muted">
                Select which pages each group is allowed to see. Users will only see links to pages their assigned groups have access to.
            </p>

            <div className="table-responsive">
                <table className="table table-bordered table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>Group</th>
                            {AVAILABLE_PAGES.map(page => <th key={page.id} className="text-center">{page.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td>{group.name}</td>
                                {AVAILABLE_PAGES.map(page => (
                                    <td key={page.id} className="text-center">
                                        <div className="form-check d-flex justify-content-center">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={permissions[group.id]?.includes(page.id) || false}
                                                onChange={() => handlePermissionChange(group.id, page.id)}
                                                disabled={!canManagePermissions}
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
    );
};

export default PermissionsManagement;