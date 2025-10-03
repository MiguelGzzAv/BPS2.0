import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import ProcessFormModal from '../components/ProcessFormModal';

const Processes = () => {
    const [processes, setProcesses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProcess, setEditingProcess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProcesses = async () => {
            try {
                const companyId = sessionStorage.getItem('selectedCompanyId');
                if (!companyId) {
                    setError('No company selected.');
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
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

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
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            const isEditing = !!editingProcess;

            const url = isEditing ? `/api/processes/${editingProcess.id}` : '/api/processes';
            const method = isEditing ? 'PUT' : 'POST';

            const response = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify({ ...processData, companyId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'create'} process`);
            }

            const savedProcess = await response.json();

            if (isEditing) {
                setProcesses(prevProcesses =>
                    prevProcesses.map(p => (p.id === savedProcess.id ? savedProcess : p))
                );
            } else {
                setProcesses(prevProcesses => [...prevProcesses, savedProcess]);
            }

            handleCloseModal();
        } catch (err) {
            setError(err.message);
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

                setProcesses(prevProcesses => prevProcesses.filter(p => p.id !== processId));
            } catch (err) {
                setError(err.message);
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
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && (
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