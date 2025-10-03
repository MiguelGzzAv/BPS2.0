import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import DepartmentFormModal from '../components/DepartmentFormModal';
import { toast } from 'react-toastify';

const Departments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState(null);

    const fetchDepartments = async () => {
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            if (!companyId) {
                toast.warn('Please select a company first.');
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
            toast.error(err.message);
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
        const isEditing = !!editingDepartment;
        const action = isEditing ? 'update' : 'create';
        const url = isEditing ? `/api/departments/${editingDepartment.id}` : '/api/departments';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            const response = await fetchWithAuth(url, {
                method,
                body: JSON.stringify({ ...departmentData, companyId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} department`);
            }

            await fetchDepartments();
            toast.success(`Department ${isEditing ? 'updated' : 'created'} successfully!`);
            handleCloseModal();
        } catch (err) {
            toast.error(err.message);
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

                await fetchDepartments();
                toast.success('Department deleted successfully!');
            } catch (err) {
                toast.error(err.message);
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
            {!loading && (
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