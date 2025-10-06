import React, { useState, useEffect } from 'react';

const GroupFormModal = ({ show, onHide, onSave, groupToEdit }) => {
    const [formData, setFormData] = useState({ id: '', name: '' });

    const isEditing = !!groupToEdit;

    useEffect(() => {
        if (isEditing) {
            setFormData({ id: groupToEdit.id, name: groupToEdit.name || '' });
        } else {
            setFormData({ id: '', name: '' });
        }
    }, [groupToEdit, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !String(formData.id).trim()) {
            alert('Group ID and Name cannot be empty.');
            return;
        }
        // Ensure ID is sent as a number if it's numeric
        onSave({ ...formData, id: isEditing ? formData.id : Number(formData.id) || formData.id });
    };

    if (!show) {
        return null;
    }

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{isEditing ? 'Edit Group' : 'Create Group'}</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="group-id" className="form-label">Group ID</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="group-id"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleChange}
                                    required
                                    disabled={isEditing}
                                    autoFocus={!isEditing}
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="group-name" className="form-label">Group Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="group-name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoFocus={isEditing}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default GroupFormModal;