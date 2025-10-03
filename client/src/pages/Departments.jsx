import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import DepartmentFormModal from '../components/DepartmentFormModal';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    const fetchDepartments = async () => {
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            if (!companyId) {
                setError('No company selected.');
                setLoading(false);
                return;
            }

            const response = await fetchWithAuth(`/api/departments?companyId=${companyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch departments');
            }
            const data = await response.json();
            setDepartments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleCreate = () => {
        setEditingDepartment(null);
        setIsModalOpen(true);
    };

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDepartment(null);
    };

    const handleSave = async (departmentData) => {
        const companyId = sessionStorage.getItem('selectedCompanyId');
        const isEditing = !!editingDepartment;
        const url = isEditing ? `/api/departments/${editingDepartment.id}` : '/api/departments';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({ ...departmentData, companyId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${isEditing ? 'update' : 'create'} department`);
            }

            fetchDepartments(); // Refetch all departments to update the list
            handleCloseModal();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (departmentId) => {
        if (window.confirm('Are you sure you want to delete this department?')) {
            try {
                const response = await fetchWithAuth(`/api/departments/${departmentId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete department');
                }

                fetchDepartments(); // Refetch all departments to update the list
            } catch (err) {
                setError(err.message);
            }
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Departments</h1>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Departamento</button>
            </div>

            {isModalOpen && (
                <DepartmentFormModal
                    department={editingDepartment}
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
                        {departments.map(department => (
                            <tr key={department.id}>
                                <td>{department.id}</td>
                                <td>{department.name}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(department)}>Edit</button>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(department.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </>
    );
};

export default Departments;
                if (!companyId) {
                    setError('No company selected.');
                    setLoading(false);
                    return;
                }

                const response = await fetchWithAuth(`/api/departments?companyId=${companyId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch departments');
                }
                const data = await response.json();
                setDepartments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Departments</h1>
                <button className="btn btn-primary">Crear Departamento</button>
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
                        {departments.map(department => (
                            <tr key={department.id}>
                                <td>{department.id}</td>
                                <td>{department.name}</td>
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

export default Departments;