import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import AddUserModal from '../components/AddUserModal';

function Users() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const handleUserAdded = () => {
        fetchUsers(); // Refresh the list when a user is added
    };

    const canAddUsers = user.role === 'admin' || user.role === 'superadmin';

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h1>User Management</h1>
                {canAddUsers && (
                    <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                        Add User
                    </button>
                )}
            </header>

            <AddUserModal
                show={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                onUserAdded={handleUserAdded}
            />

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
                                    <button className="btn btn-sm btn-warning" disabled>Edit</button>
                                    <button className="btn btn-sm btn-danger ms-2" disabled>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Users;