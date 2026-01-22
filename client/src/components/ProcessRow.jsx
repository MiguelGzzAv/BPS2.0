import React, { useState } from 'react';
import { getProcessTimeStatus } from '../utils/timeUtils';

const ProcessRow = ({ process, level = 0, processMap, onRegister, currentTime }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasChildren = process.childProcesses && process.childProcesses.length > 0;

    // Determine status and badge color
    const status = process.status || 'POR INICIAR';
    const statusClass = status.toLowerCase().replace(/\s+/g, '-');
    const badgeClass = `badge-${statusClass}`;

    // Determine row background color based on status
    const getRowClass = (status) => {
        const s = status.toLowerCase();
        if (s === 'ok') return 'table-success';
        if (s === 'falla' || s === 'error') return 'table-danger';
        if (s === 'ambar') return 'table-warning';
        if (s === 'sin ejecucion') return 'table-secondary';
        return '';
    };

    // Calculate time-based status for the button and spinner
    const ownStatus = getProcessTimeStatus(process, currentTime);
    let finalSpinnerClass = ownStatus.spinnerClass;

    // Inheritance logic: If parent is not active, check children
    if (!ownStatus.isButtonEnabled && hasChildren) {
        for (const childLink of process.childProcesses) {
            const childProc = processMap.get(childLink.id);
            if (childProc) {
                const childStatus = getProcessTimeStatus(childProc, currentTime);
                if (childStatus.isButtonEnabled) {
                    finalSpinnerClass = childStatus.spinnerClass;
                    break; // Use the first active child's status
                }
            }
        }
    }


    const hasActiveDependency = hasChildren && process.childProcesses.some(c => c.dependency);
    const hasOwnFieldsToRegister = process.internalPhases && process.internalPhases.some(phase => phase.fields && phase.fields.length > 0);
    const showRegisterButton = !(hasActiveDependency && !hasOwnFieldsToRegister);

    return (
        <>
            <tr className={getRowClass(status)}>
                <td style={{ paddingLeft: `${level * 25 + 10}px` }}>
                    {hasChildren ? (
                        <button
                            className="btn btn-sm btn-light me-2"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        <span style={{ display: 'inline-block', width: '38px' }}></span>
                    )}
                    {process.name}
                </td>
                <td>{process.startTime}</td>
                <td>{process.endTime}</td>
                <td><span className={`badge ${badgeClass}`}>{status.toUpperCase()}</span></td>
                <td className="text-center">
                    {finalSpinnerClass && (
                        <div className={`spinner-grow spinner-grow-sm ${finalSpinnerClass}`} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    )}
                </td>
                <td><span className="badge bg-secondary">{process.criticidad || 'Baja'}</span></td>
                <td>
                    {showRegisterButton && (
                        process.isLocked ? (
                            <button className="btn btn-secondary btn-sm" disabled>
                                Terminado
                            </button>
                        ) : (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => onRegister(process)}
                                disabled={!ownStatus.isButtonEnabled}
                            >
                                Registrar
                            </button>
                        )
                    )}
                </td>
            </tr>
            {isExpanded && hasChildren && process.childProcesses.map(childLink => {
                const childProc = processMap.get(childLink.id);
                if (childProc) {
                    return (
                        <ProcessRow
                            key={childProc.id}
                            process={childProc}
                            level={level + 1}
                            processMap={processMap}
                            onRegister={onRegister}
                            currentTime={currentTime}
                        />
                    );
                }
                return null;
            })}
        </>
    );
};

export default ProcessRow;