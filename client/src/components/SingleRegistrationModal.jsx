import React from 'react';

const SingleRegistrationModal = ({ show, onHide, onSave, process, userList }) => {

    const getFormFieldHtml = (field) => {
        const fieldId = `field-${field.name.replace(/\s+/g, '-')}`;
        let inputHtml;
        switch (field.type) {
            case 'status':
                inputHtml = <select id={fieldId} className="form-select" data-field-name={field.name}>
                    {['ok', 'falla', 'ambar', 'error', 'sin ejecucion'].map(opt =>
                        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    )}
                </select>;
                break;
            case 'responsable':
                inputHtml = <select id={fieldId} className="form-select" data-field-name={field.name}>
                    <option value="">Choose...</option>
                    {userList.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>;
                break;
            default:
                inputHtml = <input type="text" id={fieldId} className="form-control" data-field-name={field.name} placeholder={field.name} />;
        }
        return (
            <div className="row mb-3" key={fieldId}>
                <label htmlFor={fieldId} className="col-sm-4 col-form-label">{field.name}</label>
                <div className="col-sm-8">
                    {inputHtml}
                </div>
            </div>
        );
    };

    const handleSave = () => {
        const form = document.getElementById('modal-registration-form');
        const values = Array.from(form.querySelectorAll('[data-field-name]')).map(input => ({
            name: input.dataset.fieldName,
            value: input.value
        }));
        const phaseName = process.internalPhases[0]?.name || 'default';
        onSave(process.id, phaseName, values);
    };

    if (!show || !process) return null;

    const phase = process.internalPhases[0] || { fields: [] };

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header" style={{ backgroundColor: '#343a40', color: 'white' }}>
                        <h5 className="modal-title">Crear Registro</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <div className="process-info-bar mb-3 p-2 rounded" style={{ backgroundColor: '#e9ecef' }}>
                            <div className="d-flex justify-content-between">
                                <div><strong>Proceso:</strong> <span>{process.name}</span></div>
                                <div>
                                    <strong>Hora Inicio:</strong> <span>{process.startTime}</span>
                                    <strong className="ms-4">Hora Fin:</strong> <span>{process.endTime}</span>
                                </div>
                            </div>
                        </div>
                        <form id="modal-registration-form">
                            {phase.fields.length > 0 ? (
                                phase.fields.map(field => getFormFieldHtml(field))
                            ) : (
                                <p>No fields defined for this registration.</p>
                            )}
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onHide}>Cerrar</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave}>Guardar Registro</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SingleRegistrationModal;