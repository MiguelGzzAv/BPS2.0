import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import { useAuth } from '../contexts/AuthContext';

const RolePermissionsManager = () => {
    const { user, can } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState({});
    // Define the resources that can have permissions assigned to them
    const [resources] = useState([
        'processes', 'users', 'groups', 'escalations', 'registrations',
        'permissions', 'role-permissions', 'roles', 'maintenance', 'messaging',
        'database', 'configuration'
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);

    // State for creating a new role
    const [isCreating, setIsCreating] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    // State for editing a role name
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [editingRoleName, setEditingRoleName] = useState('');

    const companyId = user.is_superadmin ? sessionStorage.getItem('selectedCompanyId') : user.companyId;

    const fetchRolesAndPermissions = async () => {
        if (!companyId) {
            setIsLoading(false);
            setError("A company must be selected to manage roles.");
            return;
        }
        setIsLoading(true);
        try {
            const [rolesResponse, permissionsResponse] = await Promise.all([
                fetchWithAuth(`/api/roles?companyId=${companyId}`),
                fetchWithAuth(`/api/role-permissions?companyId=${companyId}`)
            ]);

            const rolesData = await rolesResponse.json();
            const permissionsData = await permissionsResponse.json();

            if (!rolesResponse.ok) throw new Error(rolesData.error || 'Failed to fetch roles.');
            if (!permissionsResponse.ok) throw new Error(permissionsData.error || 'Failed to fetch permissions.');

            setRoles(rolesData);
            setPermissions(permissionsData);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRolesAndPermissions();
    }, [companyId]);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setEditingRoleId(null); // Exit editing mode when selecting another role
    };

    const handlePermissionChange = (roleId, resource, action) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev));
            if (!newPermissions[roleId]) newPermissions[roleId] = {};
            if (!newPermissions[roleId][resource]) {
                newPermissions[roleId][resource] = { create: false, read: false, update: false, delete: false };
            }
            newPermissions[roleId][resource][action] = !newPermissions[roleId][resource][action];
            return newPermissions;
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedRole) return;
        try {
            const response = await fetchWithAuth('/api/role-permissions', {
                method: 'POST',
                body: {
                    companyId,
                    permissions: { [selectedRole.id]: permissions[selectedRole.id] || {} },
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save permissions.');
            alert('Permissions saved successfully!');
        } catch (err) {
            setError(err.message);
            alert(`Error saving permissions: ${err.message}`);
        }
    };

    const handleCreateRole = async (e) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        try {
            const response = await fetchWithAuth('/api/roles', {
                method: 'POST',
                body: { name: newRoleName, companyId },
            });
            const newRole = await response.json();
            if (!response.ok) throw new Error(newRole.error || 'Failed to create role.');
            setRoles([...roles, newRole]);
            setNewRoleName('');
            setIsCreating(false);
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const handleDeleteRole = async (roleId) => {
        if (window.confirm('Are you sure you want to delete this role? This cannot be undone.')) {
            try {
                const response = await fetchWithAuth(`/api/roles/${roleId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to delete role.');
                }
                setRoles(roles.filter(r => r.id !== roleId));
                if (selectedRole?.id === roleId) setSelectedRole(null);
            } catch (err) {
                alert(`Error: ${err.message}`);
            }
        }
    };

    const handleUpdateRoleName = async (e) => {
        e.preventDefault();
        if (!editingRoleName.trim() || !editingRoleId) return;
        try {
            const response = await fetchWithAuth(`/api/roles/${editingRoleId}`, {
                method: 'PUT',
                body: { name: editingRoleName, companyId },
            });
            const updatedRole = await response.json();
            if (!response.ok) throw new Error(updatedRole.error || 'Failed to update role.');

            setRoles(roles.map(r => (r.id === editingRoleId ? updatedRole : r)));
            if (selectedRole?.id === editingRoleId) setSelectedRole(updatedRole);
            setEditingRoleId(null);
            setEditingRoleName('');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    };

    const startEditing = (role) => {
        setEditingRoleId(role.id);
        setEditingRoleName(role.name);
        setSelectedRole(role); // Also select the role being edited
    };

    if (isLoading) return <p>Loading roles and permissions...</p>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="row">
            <div className="col-md-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h4 className="mb-0">Roles</h4>
                    {can('roles', 'create') && (
                        <button className="btn btn-sm btn-success" onClick={() => setIsCreating(true)}>New</button>
                    )}
                </div>

                {isCreating && (
                    <form onSubmit={handleCreateRole} className="d-flex mb-2">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="New role name"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            autoFocus
                        />
                        <button type="submit" className="btn btn-sm btn-primary ms-2">Save</button>
                        <button type="button" className="btn btn-sm btn-secondary ms-1" onClick={() => setIsCreating(false)}>X</button>
                    </form>
                )}

                <div className="list-group">
                    {roles.map(role => (
                        <div key={role.id} className={`list-group-item list-group-item-action ${selectedRole?.id === role.id ? 'active' : ''}`}>
                            {editingRoleId === role.id ? (
                                <form onSubmit={handleUpdateRoleName} className="d-flex align-items-center">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        value={editingRoleName}
                                        onChange={(e) => setEditingRoleName(e.target.value)}
                                        autoFocus
                                    />
                                    <button type="submit" className="btn btn-sm btn-primary ms-2">Save</button>
                                    <button type="button" className="btn btn-sm btn-secondary ms-1" onClick={() => setEditingRoleId(null)}>Cancel</button>
                                </form>
                            ) : (
                                <div className="d-flex justify-content-between align-items-center">
                                    <span onClick={() => handleRoleSelect(role)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                                        {role.name}
                                        {role.is_system_role && <span className="badge bg-secondary ms-2">System</span>}
                                    </span>
                                    {!role.is_system_role && (
                                        <div>
                                            {can('roles', 'update') && <button className="btn btn-sm btn-outline-primary py-0 px-1 me-1" onClick={() => startEditing(role)}>Edit</button>}
                                            {can('roles', 'delete') && <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteRole(role.id)}>Del</button>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-md-8">
                {selectedRole ? (
                    <div>
                        <h4>Permissions for {selectedRole.name}</h4>
                        <table className="table table-striped table-bordered table-sm">
                            <thead>
                                <tr>
                                    <th>Resource</th>
                                    <th className="text-center">Create</th>
                                    <th className="text-center">Read</th>
                                    <th className="text-center">Update</th>
                                    <th className="text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resources.map(resource => (
                                    <tr key={resource}>
                                        <td className="text-capitalize">{resource.replace(/-/g, ' ')}</td>
                                        {['create', 'read', 'update', 'delete'].map(action => (
                                            <td key={action} className="text-center">
                                                <div className="form-check d-flex justify-content-center">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={permissions[selectedRole.id]?.[resource]?.[action] || false}
                                                        onChange={() => handlePermissionChange(selectedRole.id, resource, action)}
                                                        disabled={selectedRole.is_system_role || !can('role-permissions', 'update')}
                                                    />
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {can('role-permissions', 'update') && (
                            <button
                                className="btn btn-primary"
                                onClick={handleSavePermissions}
                                disabled={selectedRole.is_system_role}
                            >
                                Save Permissions for {selectedRole.name}
                            </button>
                        )}
                        {selectedRole.is_system_role && <p className="text-muted small mt-2">System role permissions cannot be modified.</p>}
                    </div>
                ) : (
                    <div className="alert alert-info">Please select a role to view and edit its permissions, or create a new role.</div>
                )}
            </div>
        </div>
    );
};

export default RolePermissionsManager;