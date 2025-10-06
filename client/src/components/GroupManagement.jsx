import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import GroupFormModal from './GroupFormModal';

const GroupManagement = () => {
    const { user, can } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const companyId = sessionStorage.getItem('selectedCompanyId');

    const fetchGroups = useCallback(async () => {
        if (!companyId) {
            setError("Please select a company first.");
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await fetchWithAuth(`/api/groups?companyId=${companyId}`);
            if (!response.ok) throw new Error('Failed to fetch groups.');
            const data = await response.json();
            setGroups(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreate = () => {
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleSave = async (groupData) => {
        const isEditing = !!groupData.id;
        const url = isEditing ? `/api/groups/${groupData.id}` : '/api/groups';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            // The fetchWithAuth helper handles JSON.stringify, so we pass the object directly.
            const response = await fetchWithAuth(url, {
                method,
                body: { ...groupData, companyId },
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to ${isEditing ? 'update' : 'create'} group.`);
            }
            setIsModalOpen(false);
            fetchGroups(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (groupId) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                 // The fetchWithAuth helper handles JSON.stringify
                const response = await fetchWithAuth(`/api/groups/${groupId}`, {
                    method: 'DELETE',
                    body: { companyId },
                });
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.error || 'Failed to delete group.');
                }
                fetchGroups(); // Refresh list
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h2>Group Management</h2>
                {can('groups', 'create') && (
                    <button className="btn btn-primary" onClick={handleCreate}>
                        Create Group
                    </button>
                )}
            </header>

            <GroupFormModal
                show={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                onSave={handleSave}
                groupToEdit={editingGroup}
            />

            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(g => (
                            <tr key={g.id}>
                                <td>{g.id}</td>
                                <td>{g.name}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning" onClick={() => handleEdit(g)} disabled={!can('groups', 'update')}>Edit</button>
                                    <button className="btn btn-sm btn-danger ms-2" onClick={() => handleDelete(g.id)} disabled={!can('groups', 'delete')}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GroupManagement;