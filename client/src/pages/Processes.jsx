import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import ProcessFormModal from '../components/ProcessFormModal';
import { toast } from 'react-toastify';

const Processes = () => {
    const [processes, setProcesses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchProcesses = async () => {
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            if (!companyId) {
                toast.warn('Please select a company first.');
                setLoading(false);
                return;
            }

            const response = await fetchWithAuth(`/api/processes?companyId=${companyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch processes');
            }
            const data = await response.json();
            setProcesses(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcesses();
    }, []);

    const handleCreate = () => {
        setEditingProcess(null);
        setIsModalOpen(true);
    };

    const handleEdit = (process) => {
        setEditingProcess(process);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProcess(null);
    };

    const handleSaveProcess = async (processData) => {
        const isEditing = !!editingProcess;
        const action = isEditing ? 'update' : 'create';
        const url = isEditing ? `/api/processes/${editingProcess.id}` : '/api/processes';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            const response = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify({ ...processData, companyId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} process`);
            }

            await fetchProcesses(); // Refetch to get the latest list
            toast.success(`Process ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCloseModal();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleDelete = async (processId) => {
        if (window.confirm('Are you sure you want to delete this process?')) {
            try {
                const response = await fetchWithAuth(`/api/processes/${processId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete process');
                }

                await fetchProcesses(); // Refetch to get the latest list
                toast.success('Process deleted successfully!');
            } catch (err) {
                toast.error(err.message);
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Processes</h1>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Proceso</button>
            </div>

            {isModalOpen && (
                <ProcessFormModal
                    process={editingProcess}
                    onSave={handleSaveProcess}
                    onClose={handleCloseModal}
                />
            )}

            {loading && <p>Loading...</p>}
            {!loading && (
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processes.map(process => (
                            <tr key={process.id}>
                                <td>{process.id}</td>
                                <td>{process.name}</td>
                                <td>{process.description}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(process)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(process.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Processes;