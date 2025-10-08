// --- Helper function to assemble process data from flat SQL results ---
const assembleProcessObjects = (processes, phases, fields, dependencies) => {
    const processMap = new Map(processes.map(p => [p.id, { ...p, internalPhases: [], childProcesses: [] }]));
    const phaseMap = new Map(phases.map(ph => [ph.id, { ...ph, fields: [] }]));

    for (const field of fields) {
        if (phaseMap.has(field.phase_id)) {
            const formattedField = { name: field.name, type: field.type, order: field.field_order };
            phaseMap.get(field.phase_id).fields.push(formattedField);
        }
    }

    for (const phase of phaseMap.values()) {
        if (processMap.has(phase.process_id)) {
            phase.fields.sort((a, b) => a.order - b.order);
            const formattedPhase = { name: phase.name, order: phase.phase_order, fields: phase.fields };
            processMap.get(phase.process_id).internalPhases.push(formattedPhase);
        }
    }

    for (const proc of processMap.values()) {
        proc.internalPhases.sort((a, b) => a.order - b.order);
    }

    for (const dep of dependencies) {
        if (processMap.has(dep.parent_process_id)) {
            processMap.get(dep.parent_process_id).childProcesses.push({ id: dep.child_process_id, dependency: dep.dependency });
        }
    }

    return Array.from(processMap.values());
};

// --- Status Calculation Logic ---
const calculateAllProcessStates = (processes, allRegistrations, forDate) => {
    if (!processes || processes.length === 0) {
        return new Map();
    }
    const processMap = new Map(processes.map(p => [p.id, p]));
    const calculatedStates = new Map();
    const isSameDayUTC = (date1, date2) =>
        date1.getUTCFullYear() === date2.getUTCFullYear() &&
        date1.getUTCMonth() === date2.getUTCMonth() &&
        date1.getUTCDate() === date2.getUTCDate();

    const getOwnStatus = (procId) => {
        const relevantRegistrations = (allRegistrations || [])
            .filter(r => r.processId === procId && isSameDayUTC(new Date(r.timestamp), forDate))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        if (relevantRegistrations.length === 0) return 'sin ejecucion';
        const proc = processMap.get(procId);
        if (!proc || !proc.internalPhases) return 'sin ejecucion';
        for (const reg of relevantRegistrations) {
            const phaseName = reg.phase || 'default';
            const phaseDef = proc.internalPhases.find(p => p.name === phaseName);
            if (phaseDef && phaseDef.fields) {
                const statusFieldDef = phaseDef.fields.find(f => f.type === 'status');
                if (statusFieldDef) {
                    const statusFieldName = statusFieldDef.name;
                    // Ensure reg.values is an array before calling find
                    const valuesArray = Array.isArray(reg.values) ? reg.values : [];
                    const statusValue = valuesArray.find(v => v.name === statusFieldName);
                    if (statusValue && statusValue.value) {
                        return statusValue.value.toLowerCase();
                    }
                }
            }
        }
        return 'sin ejecucion';
    };

    const getStatus = (procId) => {
        if (calculatedStates.has(procId)) return calculatedStates.get(procId);
        const proc = processMap.get(procId);
        if (!proc) return 'sin ejecucion';
        const statusPriority = { 'error': 4, 'falla': 3, 'ambar': 2, 'ok': 1, 'sin ejecucion': 0, 'por iniciar': 0 };
        let mostCriticalChildStatus = 'sin ejecucion';
        let hasDependentChildren = false;
        if (proc.childProcesses && proc.childProcesses.length > 0) {
            proc.childProcesses.forEach(childRef => {
                const childProc = processMap.get(childRef.id);
                if (childProc && childRef.dependency) {
                    hasDependentChildren = true;
                    const childStatus = getStatus(childRef.id);
                    if (statusPriority[childStatus] > statusPriority[mostCriticalChildStatus]) {
                        mostCriticalChildStatus = childStatus;
                    }
                }
            });
        }
        let finalStatus;
        if (hasDependentChildren && mostCriticalChildStatus !== 'sin ejecucion') {
            finalStatus = mostCriticalChildStatus;
        } else {
            finalStatus = getOwnStatus(proc.id);
        }
        calculatedStates.set(procId, finalStatus);
        return finalStatus;
    };
    processes.forEach(p => getStatus(p.id));
    return calculatedStates;
};

module.exports = {
    assembleProcessObjects,
    calculateAllProcessStates,
};