import React, { useState, useEffect } from 'react';

const CompanyFormModal = ({ show, onHide, onSave, company }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (company) {
            setName(company.name);
        } else {
            setName('');
        }
    }, [company, show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name });
    };

    if (!show) return null;

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">{company ? 'Edit Company' : 'Add New Company'}</h5>
                            <button type="button" className="btn-close" onClick={onHide}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="company-name" className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="company-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
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

export default CompanyFormModal;