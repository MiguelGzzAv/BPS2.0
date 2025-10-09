import React, { useState, useEffect } from 'react';

const LinkChildProcessModal = ({ show, onHide, onSave, allProcesses, currentProcessId, currentlyLinkedIds }) => {
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (show) {
            setSelectedIds(currentlyLinkedIds);
        }
    }, [show, currentlyLinkedIds]);

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setSelectedIds(prev =>
            checked ? [...prev, value] : prev.filter(id => id !== value)
        );
    };

    const handleSave = () => {
        onSave(selectedIds);
        onHide();
    };

    // Filter out the current process from the list of available processes to link
    const availableProcesses = allProcesses.filter(p => p.id !== currentProcessId);

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Link Child Processes</h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        {availableProcesses.length > 0 ? (
                            availableProcesses.map(p => (
                                <div className="form-check" key={p.id}>
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        value={p.id}
                                        id={`child-link-${p.id}`}
                                        checked={selectedIds.includes(p.id)}
                                        onChange={handleCheckboxChange}
                                    />
                                    <label className="form-check-label" htmlFor={`child-link-${p.id}`}>
                                        {p.name} ({p.id})
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p>No other processes available to link.</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Save Links</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkChildProcessModal;