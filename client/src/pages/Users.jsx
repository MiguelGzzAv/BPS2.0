import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import UserFormModal from '../components/UserFormModal';
import GroupManagement from '../components/GroupManagement';

function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const companyId = sessionStorage.getItem('selectedCompanyId');

    const fetchUsers = async () => {
        if (user.role !== 'superadmin' && !companyId) {
            setError("Please select a company first.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const url = user.role === 'superadmin' ? '/api/users' : `/api/users?companyId=${companyId}`;
            const response = await fetchWithAuth(url);
            if (!response.ok) throw new Error('Failed to fetch users.');
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user.role, companyId]);

    const handleSave = () => {
        fetchUsers(); // Refresh the list
    };

    const handleCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleEdit = (userToEdit) => {
        setEditingUser(userToEdit);
        setIsModalOpen(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetchWithAuth(`/api/users/${userId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to delete user.');
                }
                fetchUsers(); // Refresh list
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const canManageUser = (targetUser) => {
        if (user.role === 'superadmin') return true;
        if (user.role === 'admin') {
            return targetUser.companyId === user.companyId && targetUser.role !== 'admin' && targetUser.role !== 'superadmin';
        }
        return false;
    };

    const [activeTab, setActiveTab] = useState('users');
    const canAddUsers = user.role === 'admin' || user.role === 'superadmin';

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h1>User and Group Management</h1>
                {canAddUsers && (
                    <button className="btn btn-primary" onClick={handleCreate}>
                        Add User
                    </button>
                )}
            </header>

            <UserFormModal
                show={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                onSave={handleSave}
                userToEdit={editingUser}
            />

            <ul className="nav nav-tabs">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
                        Users
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
                        Groups
                    </button>
                </li>
            </ul>

            <div className="tab-content pt-3">
                {activeTab === 'users' && (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    {user.role === 'superadmin' && <th>Company</th>}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="user-list">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email || ''}</td>
                                        <td>{u.username}</td>
                                        <td>{u.role}</td>
                                        {user.role === 'superadmin' && <td>{u.companyName || 'N/A'}</td>}
                                        <td>
                                            <button className="btn btn-sm btn-warning" onClick={() => handleEdit(u)} disabled={!canManageUser(u)}>Edit</button>
                                            <button className="btn btn-sm btn-danger ms-2" onClick={() => handleDelete(u.id)} disabled={!canManageUser(u) || u.id === user.id}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab === 'groups' && <GroupManagement />}
            </div>
        </div>
    );
}

export default Users;