import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';

function UserFormModal({ show, onHide, onSave, userToEdit }) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', username: '',
        password: '', role: 'reader', companyId: ''
    });
    const [companies, setCompanies] = useState([]);
    const [error, setError] = useState('');

    const isEditing = !!userToEdit;

    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: userToEdit.name || '',
                email: userToEdit.email || '',
                phone: userToEdit.phone || '',
                username: userToEdit.username || '',
                password: '', // Always clear password for edits
                role: userToEdit.role || 'reader',
                companyId: userToEdit.companyId || ''
            });
        } else {
            setFormData({
                name: '', email: '', phone: '', username: '',
                password: '', role: 'reader', companyId: ''
            });
        }
    }, [userToEdit, show]);

    useEffect(() => {
        if (user.role === 'superadmin' && show) {
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
    }, [user.role, show, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const url = isEditing ? `/api/users/${userToEdit.id}` : '/api/users';
        const method = isEditing ? 'PUT' : 'POST';
        const payload = { ...formData };
        if (user.role !== 'superadmin') {
            payload.companyId = sessionStorage.getItem('selectedCompanyId');
        }
        if (isEditing && !payload.password) {
            delete payload.password;
        }

        try {
            const response = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify(payload),
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

    const availableRoles = user.role === 'superadmin' ? ['admin', 'operator', 'reader', 'superadmin'] : ['operator', 'reader'];
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
                            {user.role === 'superadmin' && (
                                <div className="mb-3">
                                    <label htmlFor="companyId" className="form-label">Company</label>
                                    <select name="companyId" id="companyId" className="form-select" value={formData.companyId} onChange={handleChange} required>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Full Name</label>
                                <input type="text" name="name" id="name" className="form-control" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3"><label htmlFor="email" className="form-label">Email</label><input type="email" name="email" id="email" className="form-control" value={formData.email} onChange={handleChange} /></div>
                                <div className="col-md-6 mb-3"><label htmlFor="phone" className="form-label">Phone</label><input type="tel" name="phone" id="phone" className="form-control" value={formData.phone} onChange={handleChange} /></div>
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
                                <label htmlFor="role" className="form-label">Role</label>
                                <select name="role" id="role" className="form-select" value={formData.role} onChange={handleChange} required disabled={user.role !== 'superadmin' && isEditing}>
                                    {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
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