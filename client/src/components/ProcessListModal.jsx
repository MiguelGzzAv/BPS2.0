import React from 'react';

const ProcessListModal = ({ show, onHide, title, processes }) => {
    if (!show) {
        return null;
    }

    const getCriticidadBadge = (criticidad) => {
        const level = criticidad || 'Baja';
        let badgeClass = 'bg-secondary';
        if (level === 'Media') badgeClass = 'bg-warning text-dark';
        if (level === 'Alta') badgeClass = 'bg-danger';
        return <span className={`badge ${badgeClass}`}>{level}</span>;
    };

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{title || 'Process List'}</h5>
                        <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        {processes && processes.length > 0 ? (
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th scope="col">Process Name</th>
                                        <th scope="col">Criticidad</th>
                                        <th scope="col">ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processes.map(proc => (
                                        <tr key={proc.id}>
                                            <td>{proc.name}</td>
                                            <td>{getCriticidadBadge(proc.criticidad)}</td>
                                            <td>{proc.id}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No processes to display for this category.</p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessListModal;