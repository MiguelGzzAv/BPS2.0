import React from 'react';

const MultiPhaseRegistrationModal = ({ show, onHide, onSave, process, allRegistrations, userList }) => {

    const getFormFieldHtml = (field, keyPrefix) => {
        const fieldId = `field-${keyPrefix}-${field.name.replace(/\s+/g, '-')}`;
        let inputHtml;
        switch (field.type) {
            case 'status':
                inputHtml = <select id={fieldId} className="form-select form-select-sm" data-field-name={field.name}>
                    {['ok', 'falla', 'ambar', 'error', 'sin ejecucion'].map(opt =>
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    )}
                </select>;
                break;
            case 'responsable':
                inputHtml = <select id={fieldId} className="form-select form-select-sm" data-field-name={field.name}>
                    <option value="">Choose...</option>
                    {userList.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>;
                break;
            default:
                inputHtml = <input type="text" id={fieldId} className="form-control form-control-sm" data-field-name={field.name} placeholder={field.name} />;
        }
        return <div key={fieldId} className="mb-2">{inputHtml}</div>;
    };

    const handleSavePhase = (e) => {
        const button = e.target;
        const phaseName = button.dataset.phaseName;
        const phaseRow = button.closest('tr');
        const values = Array.from(phaseRow.querySelectorAll('[data-field-name]')).map(input => ({
            name: input.dataset.fieldName,
            value: input.value
        }));
        onSave(process.id, phaseName, values);
    };

    if (!show || !process) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header" style={{ backgroundColor: '#0d6efd', color: 'white' }}>
                        <h5 className="modal-title">Registrar Fases: {process.name}</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead className="table-light">
                                    <tr>
                                        <th>Fase</th>
                                        <th>Estatus Actual</th>
                                        <th>Campos de Registro</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {process.internalPhases.map(phase => {
                                        const latestPhaseReg = allRegistrations
                                            .filter(r => r.processId === process.id && r.phase === phase.name)
                                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

                                        const statusField = phase.fields.find(f => f.type === 'status');
                                        const statusValue = latestPhaseReg?.values.find(v => v.name === statusField?.name)?.value || 'N/A';
                                        const badgeClass = `badge-${statusValue.toLowerCase().replace(/\s+/g, '-')}`;

                                        return (
                                            <tr key={phase.name}>
                                                <td>{phase.name}</td>
                                                <td><span className={`badge ${badgeClass}`}>{statusValue.toUpperCase()}</span></td>
                                                <td>
                                                    {(phase.fields || []).map(field => getFormFieldHtml(field, phase.name))}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-success btn-sm"
                                                        data-phase-name={phase.name}
                                                        onClick={handleSavePhase}
                                                    >
                                                        Guardar
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiPhaseRegistrationModal;