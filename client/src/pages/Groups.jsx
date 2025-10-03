import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import GroupFormModal from '../components/GroupFormModal';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchGroups = async () => {
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            if (!companyId) {
                setError('No company selected.');
                setLoading(false);
                return;
            }

            const response = await fetchWithAuth(`/api/groups?companyId=${companyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch groups');
            }
            const data = await response.json();
            setGroups(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleCreate = () => {
        setEditingGroup(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group) => {
        setEditingGroup(group);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingGroup(null);
    };

    const handleSave = async (groupData) => {
        const companyId = sessionStorage.getItem('selectedCompanyId');
        const isEditing = !!editingGroup;
        const url = isEditing ? `/api/groups/${editingGroup.id}` : '/api/groups';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({ ...groupData, companyId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'create'} group`);
            }

            fetchGroups(); // Refetch all groups to update the list
            handleCloseModal();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (groupId) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                const response = await fetchWithAuth(`/api/groups/${groupId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete group');
                }

                fetchGroups(); // Refetch all groups to update the list
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Groups</h1>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Grupo</button>
            </div>

            {isModalOpen && (
                <GroupFormModal
                    group={editingGroup}
                    onSave={handleSave}
                    onClose={handleCloseModal}
                />
            )}

            {loading && <p>Loading...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td>{group.id}</td>
                                <td>{group.name}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(group)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(group.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Groups;
                if (!companyId) {
                    setError('No company selected.');
                    setLoading(false);
                    return;
                }

                const response = await fetchWithAuth(`/api/groups?companyId=${companyId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch groups');
                }
                const data = await response.json();
                setGroups(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Groups</h1>
                <button className="btn btn-primary">Crear Grupo</button>
            </div>
            {loading && <p>Loading...</p>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {groups.map(group => (
                            <tr key={group.id}>
                                <td>{group.id}</td>
                                <td>{group.name}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2">Edit</button>
                                    <button className="btn btn-sm btn-danger">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Groups;