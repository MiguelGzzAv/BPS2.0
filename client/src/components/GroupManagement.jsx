import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import GroupFormModal from './GroupFormModal';
import { toast } from 'react-toastify';

const GroupManagement = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            if (!companyId) {
                toast.warn('Please select a company first.');
                return;
            }
            const response = await fetchWithAuth(`/api/groups?companyId=${companyId}`);
            if (!response.ok) throw new Error('Failed to fetch groups');
            const data = await response.json();
            setGroups(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const handleSave = async () => {
        await fetchGroups();
        toast.success(`Group ${editingGroup ? 'updated' : 'created'} successfully!`);
        setIsModalOpen(false);
    };

    const handleDelete = async (groupId) => {
        if (window.confirm('Are you sure you want to delete this group?')) {
            try {
                const response = await fetchWithAuth(`/api/groups/${groupId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete group');
                await fetchGroups();
                toast.success('Group deleted successfully!');
            } catch (err) {
                toast.error(err.message);
            }
        }
    };

    return (
        <div>
            {isModalOpen && (
                <GroupFormModal
                    group={editingGroup}
                    onSave={handleSave}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            <div className="d-flex justify-content-end my-3">
                <button onClick={() => { setEditingGroup(null); setIsModalOpen(true); }} className="btn btn-primary">Add Group</button>
            </div>
            {loading ? (
                <p>Loading groups...</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Group Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groups.map(group => (
                                <tr key={group.id}>
                                    <td>{group.name}</td>
                                    <td>
                                        <button onClick={() => { setEditingGroup(group); setIsModalOpen(true); }} className="btn btn-sm btn-warning me-2">Edit</button>
                                        <button onClick={() => handleDelete(group.id)} className="btn btn-sm btn-danger">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default GroupManagement;