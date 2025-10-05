import React, { useState, useEffect } from 'react';
import LinkChildProcessModal from './LinkChildProcessModal';

const ProcessFormModal = ({ process, allProcesses, onSave, onClose }) => {
    const [formData, setFormData] = useState({
        id: '', name: '', startTime: '', endTime: '',
        criticidad: 'Baja', frequency: 'Diario', days: [],
        mode: 'Individual', internalPhases: [{ name: 'default', fields: [] }],
        childProcesses: []
    });
    const [isLinkChildModalOpen, setIsLinkChildModalOpen] = useState(false);

    useEffect(() => {
        if (process) {
            setFormData({
                id: process.id || '',
                name: process.name || '',
                startTime: process.startTime || '',
                endTime: process.endTime || '',
                criticidad: process.criticidad || 'Baja',
                frequency: process.frequency || 'Diario',
                days: process.days || [],
                mode: process.mode || 'Individual',
                internalPhases: process.internalPhases && process.internalPhases.length > 0 ? process.internalPhases : [{ name: 'default', fields: [] }],
                childProcesses: process.childProcesses || []
            });
        } else {
            setFormData({
                id: '', name: '', startTime: '', endTime: '',
                criticidad: 'Baja', frequency: 'Diario', days: [],
                mode: 'Individual', internalPhases: [{ name: 'default', fields: [] }],
                childProcesses: []
            });
        }
    }, [process]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'mode') {
            handleModeChange(value);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleDayChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            days: checked ? [...prev.days, value] : prev.days.filter(day => day !== value)
        }));
    };

    const handleModeChange = (newMode) => {
        setFormData(prev => ({
            ...prev,
            mode: newMode,
            internalPhases: newMode === 'Individual' ? [{ name: 'default', fields: [] }] : []
        }));
    };

    const handlePhaseChange = (index, field, value) => {
        setFormData(prev => {
            const newPhases = [...prev.internalPhases];
            newPhases[index][field] = value;
            return { ...prev, internalPhases: newPhases };
        });
    };

    const handleFieldChange = (phaseIndex, fieldIndex, field, value) => {
        setFormData(prev => {
            const newPhases = [...prev.internalPhases];
            newPhases[phaseIndex].fields[fieldIndex][field] = value;
            return { ...prev, internalPhases: newPhases };
        });
    };

    const addPhase = () => setFormData(prev => ({ ...prev, internalPhases: [...prev.internalPhases, { name: `Phase ${prev.internalPhases.length + 1}`, fields: [] }] }));
    const removePhase = (index) => setFormData(prev => ({ ...prev, internalPhases: prev.internalPhases.filter((_, i) => i !== index) }));
    const addField = (phaseIndex) => {
        setFormData(prev => {
            const newPhases = [...prev.internalPhases];
            newPhases[phaseIndex].fields.push({ name: '', type: 'text' });
            return { ...prev, internalPhases: newPhases };
        });
    };
    const removeField = (phaseIndex, fieldIndex) => {
        setFormData(prev => {
            const newPhases = [...prev.internalPhases];
            newPhases[phaseIndex].fields = newPhases[phaseIndex].fields.filter((_, i) => i !== fieldIndex);
            return { ...prev, internalPhases: newPhases };
        });
    };

    const handleSaveLinkedChildren = (selectedIds) => {
        const newChildProcesses = selectedIds.map(id => {
            const existing = formData.childProcesses.find(c => c.id === id);
            return existing || { id, dependency: false };
        });
        setFormData(prev => ({ ...prev, childProcesses: newChildProcesses }));
    };

    const handleChildDependencyChange = (childId, isChecked) => {
        setFormData(prev => ({
            ...prev,
            childProcesses: prev.childProcesses.map(c => c.id === childId ? { ...c, dependency: isChecked } : c)
        }));
    };

    const removeChildProcess = (childId) => {
        setFormData(prev => ({ ...prev, childProcesses: prev.childProcesses.filter(c => c.id !== childId) }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{process ? 'Edit Process' : 'Add New Process'}</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <form id="process-form" onSubmit={handleSubmit}>
                                {/* Basic Info */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-id" className="form-label">Process ID</label>
                                        <input type="text" className="form-control" id="process-id" name="id" value={formData.id} onChange={handleChange} required disabled={!!process} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-name" className="form-label">Process Name</label>
                                        <input type="text" className="form-control" id="process-name" name="name" value={formData.name} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-startTime" className="form-label">Start Time</label>
                                        <input type="time" className="form-control" id="process-startTime" name="startTime" value={formData.startTime} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-endTime" className="form-label">End Time</label>
                                        <input type="time" className="form-control" id="process-endTime" name="endTime" value={formData.endTime} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-criticidad" className="form-label">Criticidad</label>
                                        <select className="form-select" id="process-criticidad" name="criticidad" value={formData.criticidad} onChange={handleChange}>
                                            <option value="Baja">Baja</option>
                                            <option value="Media">Media</option>
                                            <option value="Alta">Alta</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label htmlFor="process-frequency" className="form-label">Frequency</label>
                                        <select className="form-select" id="process-frequency" name="frequency" value={formData.frequency} onChange={handleChange}>
                                            <option value="Diario">Diario</option>
                                            <option value="Personalizado">Personalizado</option>
                                        </select>
                                    </div>
                                </div>
                                {formData.frequency === 'Personalizado' && (<div className="mb-3"><label className="form-label">Select Days</label><div>{weekDays.map(day => (<div key={day} className="form-check form-check-inline"><input className="form-check-input" type="checkbox" value={day} checked={formData.days.includes(day)} onChange={handleDayChange} /><label className="form-check-label">{day}</label></div>))}</div></div>)}
                                <hr />
                                {/* Process Logic */}
                                <div className="row">
                                    <div className="col-md-6 mb-3"><label className="form-label">Process Mode</label><select className="form-select" name="mode" value={formData.mode} onChange={handleChange}><option value="Individual">Individual</option><option value="Multiple">Multiple Internal Phases</option></select></div>
                                </div>
                                {/* Child Process Linking */}
                                <hr />
                                <h5>Child Processes</h5>
                                <div className="mb-3">
                                    {formData.childProcesses.map(child => {
                                        const proc = allProcesses.find(p => p.id === child.id);
                                        return (<div key={child.id} className="d-flex justify-content-between align-items-center border-bottom py-2"><span>{proc ? `${proc.name} (${proc.id})` : `Unknown (${child.id})`}</span><div><div className="form-check form-check-inline"><input className="form-check-input" type="checkbox" checked={child.dependency} onChange={(e) => handleChildDependencyChange(child.id, e.target.checked)} /><label className="form-check-label">Dependencia</label></div><button type="button" className="btn btn-danger btn-sm" onClick={() => removeChildProcess(child.id)}>X</button></div></div>);
                                    })}
                                    {formData.childProcesses.length === 0 && <p className="text-muted">No child processes linked.</p>}
                                </div>
                                <button type="button" className="btn btn-outline-success btn-sm" onClick={() => setIsLinkChildModalOpen(true)}>+ Vincular Hijo</button>
                                {/* Phases Editor */}
                                <div id="phases-editor">
                                    <hr />
                                    <h5>{formData.mode === 'Multiple' ? 'Define Internal Phases' : 'Define Registration Fields'}</h5>
                                    {formData.internalPhases.map((phase, pIndex) => (
                                        <div key={pIndex} className="border p-3 mb-3 rounded">
                                            {formData.mode === 'Multiple' && (
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <input type="text" className="form-control" placeholder="Phase Name" value={phase.name} onChange={(e) => handlePhaseChange(pIndex, 'name', e.target.value)} />
                                                    <button type="button" className="btn btn-danger btn-sm ms-2" onClick={() => removePhase(pIndex)}>Remove Phase</button>
                                                </div>
                                            )}
                                            {phase.fields.map((field, fIndex) => (
                                                <div key={fIndex} className="row mb-2 align-items-center">
                                                    <div className="col-md-5"><input type="text" className="form-control" placeholder="Field Name" value={field.name} onChange={(e) => handleFieldChange(pIndex, fIndex, 'name', e.target.value)} /></div>
                                                    <div className="col-md-5">
                                                        <select className="form-select" value={field.type} onChange={(e) => handleFieldChange(pIndex, fIndex, 'type', e.target.value)}>
                                                            <option value="text">Text</option><option value="status">Status</option><option value="responsable">Responsable</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-2"><button type="button" className="btn btn-danger btn-sm" onClick={() => removeField(pIndex, fIndex)}>X</button></div>
                                                </div>
                                            ))}
                                            <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={() => addField(pIndex)}>+ Add Field</button>
                                        </div>
                                    ))}
                                    {formData.mode === 'Multiple' && <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={addPhase}>+ Add Phase</button>}
                                </div>
                            </form>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
                            <button type="submit" form="process-form" className="btn btn-primary">Save Process</button>
                        </div>
                    </div>
                </div>
            </div>
            {isLinkChildModalOpen && (
                <LinkChildProcessModal
                    show={isLinkChildModalOpen}
                    onHide={() => setIsLinkChildModalOpen(false)}
                    onSave={handleSaveLinkedChildren}
                    allProcesses={allProcesses}
                    currentProcessId={formData.id}
                    currentlyLinkedIds={formData.childProcesses.map(c => c.id)}
                />
            )}
        </>
    );
};

export default ProcessFormModal;