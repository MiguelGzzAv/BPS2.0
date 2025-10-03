import React from 'react';

const AccessConfirmModal = ({ show, onHide, onConfirm, companyName }) => {
    if (!show) return null;

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Access Company</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <p>Are you sure you want to access the company: <strong>{companyName}</strong>?</p>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={onConfirm}>OK</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessConfirmModal;