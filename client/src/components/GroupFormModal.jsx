import React, { useState, useEffect } from 'react';

const GroupFormModal = ({ show, onHide, onSave, groupToEdit }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
        } else {
            setName('');
        }
    }, [groupToEdit, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Group name cannot be empty.');
            return;
        }
        onSave({ id: groupToEdit?.id, name });
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
                            <h5 className="modal-title">{groupToEdit ? 'Edit Group' : 'Create Group'}</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="group-name" className="form-label">Group Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="group-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
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