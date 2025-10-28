import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

function UserFormModal({ show, onHide, onSave, userToEdit }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', username: '',
        password: '', role_id: '', companyId: '', groupIds: []
    });
    const [companies, setCompanies] = useState([]);
    const [groups, setGroups] = useState([]);
    const [roles, setRoles] = useState([]); // State to store available roles
    const [error, setError] = useState('');

    const isEditing = !!userToEdit;

    // Effect to reset and populate form when modal opens or userToEdit changes
    useEffect(() => {
        if (show) {
            if (isEditing) {
                setFormData({
                    name: userToEdit.name || '',
                    email: userToEdit.email || '',
                    phone: userToEdit.phone || '',
                    username: userToEdit.username || '',
                    password: '', // Always clear password for security
                    role_id: userToEdit.role_id || '', // Use role_id
                    companyId: userToEdit.companyId || '',
                    groupIds: userToEdit.groupIds || []
                });
            } else {
                setFormData({
                    name: '', email: '', phone: '', username: '',
                    password: '', role_id: '', companyId: '', groupIds: []
                });
            }
        }
    }, [userToEdit, show, isEditing]);

    // Effect to fetch companies if the user is a superadmin
    useEffect(() => {
        if (user.is_superadmin && show) {
            const fetchCompanies = async () => {
                try {
                    const response = await fetchWithAuth('/api/companies');
                    const data = await response.json();
                    setCompanies(data);
                    if (data.length > 0 && !isEditing) {
                        setFormData(prev => ({ ...prev, companyId: data[0].id }));
                    }
                } catch (err) {
                    console.error("Failed to fetch companies", err);
                }
            };
            fetchCompanies();
        }
    }, [user.is_superadmin, show, isEditing]);

    // Effect to fetch groups and roles based on the selected company
    useEffect(() => {
        const companyIdToFetch = user.is_superadmin ? formData.companyId : sessionStorage.getItem('selectedCompanyId');

        if (show && companyIdToFetch) {
            const fetchGroupsAndRoles = async () => {
                try {
                    const [groupsResponse, rolesResponse] = await Promise.all([
                        fetchWithAuth(`/api/groups?companyId=${companyIdToFetch}`),
                        fetchWithAuth(`/api/roles?companyId=${companyIdToFetch}`)
                    ]);

                    if (!groupsResponse.ok) throw new Error('Failed to fetch groups.');
                    const groupsData = await groupsResponse.json();
                    setGroups(groupsData);

                    if (!rolesResponse.ok) throw new Error('Failed to fetch roles.');
                    const rolesData = await rolesResponse.json();
                    setRoles(rolesData);

                    if (!isEditing && rolesData.length > 0) {
                        setFormData(prev => ({ ...prev, role_id: rolesData[0].id }));
                    }

                } catch (err) {
                    console.error("Failed to fetch groups or roles", err);
                    setError("Could not load necessary data for this company.");
                }
            };
            fetchGroupsAndRoles();
        }
    }, [show, formData.companyId, user.is_superadmin, isEditing]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleGroupChange = (groupId, isChecked) => {
        setFormData(prev => {
            const currentGroupIds = prev.groupIds || [];
            if (isChecked) {
                return { ...prev, groupIds: [...new Set([...currentGroupIds, groupId])] };
            } else {
                return { ...prev, groupIds: currentGroupIds.filter(id => id !== groupId) };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = isEditing ? `/api/users/${userToEdit.id}` : '/api/users';
        const method = isEditing ? 'PUT' : 'POST';

        const payload = { ...formData };
        if (!user.is_superadmin) {
            payload.companyId = sessionStorage.getItem('selectedCompanyId');
        }
        if (isEditing && !payload.password) {
            delete payload.password;
        }

        try {
            const response = await fetchWithAuth(url, {
                method: method,
                body: payload,
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to ${isEditing ? 'update' : 'create'} user.`);
            }
            onSave();
            onHide();
        } catch (err) {
            setError(err.message);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{isEditing ? 'Edit User' : 'Add New User'}</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}
                            {user.is_superadmin && (
                                <div className="mb-3">
                                    <label htmlFor="companyId" className="form-label">Company</label>
                                    <select name="companyId" id="companyId" className="form-select" value={formData.companyId} onChange={handleChange} required>
                                        <option value="">Select a company...</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Full Name</label>
                                <input type="text" name="name" id="name" className="form-control" value={formData.name} onChange={handleChange} required />
                            </div>
                            <hr />
                            <div className="row">
                                <div className="col-md-6 mb-3"><label htmlFor="username" className="form-label">Username</label><input type="text" name="username" id="username" className="form-control" value={formData.username} onChange={handleChange} required /></div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="password" className="form-label">Password</label>
                                    <input type="password" name="password" id="password" className="form-control" value={formData.password} onChange={handleChange} required={!isEditing} placeholder={isEditing ? "Leave blank to keep current password" : ""} />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="role_id" className="form-label">Role</label>
                                <select name="role_id" id="role_id" className="form-select" value={formData.role_id} onChange={handleChange} required>
                                    <option value="">Select a role...</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Groups</label>
                                <div className="border rounded p-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                    {groups.length > 0 ? groups.map(g => (
                                        <div key={g.id} className="form-check">
                                            <input className="form-check-input" type="checkbox" id={`group-${g.id}`} checked={formData.groupIds.includes(g.id)} onChange={(e) => handleGroupChange(g.id, e.target.checked)} />
                                            <label className="form-check-label" htmlFor={`group-${g.id}`}>{g.name}</label>
                                        </div>
                                    )) : <p className="text-muted small mb-0">No groups available for this company.</p>}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
                            <button type="submit" className="btn btn-primary">Save User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UserFormModal;