const { processesByCompany, registrationsByCompany } = require('../data/database');
const { hasPermission } = require('../utils/permissionUtils');

// --- Status Calculation Logic (remains unchanged) ---
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
                    const statusValue = reg.values.find(v => v.name === statusFieldName);
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


const getProcesses = (req, res) => {
    let companyId;
    if (req.user.role === 'superadmin') {
        companyId = req.query.companyId;
    } else {
        companyId = req.user.companyId;
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    if (!hasPermission(req.user.role, 'processes', 'read', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view processes.' });
    }

    const { date } = req.query;
    const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
    if (!date) forDate.setUTCHours(0, 0, 0, 0);

    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];

    // Calculate lock status based on the last 24 hours
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const lastRegistrationMap = new Map();
    (registrations || []).forEach(reg => {
        const regTimestamp = new Date(reg.timestamp);
        if (!lastRegistrationMap.has(reg.processId) || regTimestamp > lastRegistrationMap.get(reg.processId)) {
            lastRegistrationMap.set(reg.processId, regTimestamp);
        }
    });

    const states = calculateAllProcessStates(processes, registrations, forDate);

    const processesWithStatusAndLock = processes.map(p => {
        const lastRegTime = lastRegistrationMap.get(p.id);
        const isLocked = lastRegTime ? lastRegTime > twentyFourHoursAgo : false;

        return {
            ...p,
            status: states.get(p.id) || 'sin ejecucion',
            isLocked: isLocked
        };
    });

    res.json(processesWithStatusAndLock);
};

const createProcess = (req, res) => {
    const { processData, companyId: reqCompanyId } = req.body;
    const companyId = req.user.role === 'superadmin' ? reqCompanyId : req.user.companyId;

    if (!hasPermission(req.user.role, 'processes', 'create', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to create processes.' });
    }
    if (!companyId) {
        return res.status(400).json({ error: 'Superadmin must provide a companyId to create a process.' });
    }
    if (!processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'Process data (including id and name) is required.' });
    }
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    const newProcess = {
        ...processData,
        criticidad: processData.criticidad || 'Baja',
        mode: processData.mode || 'Individual',
        internalPhases: processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: [] }],
        childProcesses: processData.childProcesses || [],
        escalationLevels: processData.escalationLevels || 5,
    };
    processesByCompany[companyId].push(newProcess);
    res.status(201).json(newProcess);
};

const updateProcess = (req, res) => {
    const { id } = req.params;
    const { processData, companyId: reqCompanyId } = req.body;
    const companyId = req.user.role === 'superadmin' ? reqCompanyId : req.user.companyId;

    if (!hasPermission(req.user.role, 'processes', 'update', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update processes.' });
    }
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided to update a process.' });
    }
    if (!processData) {
        return res.status(400).json({ error: 'processData is required' });
    }
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found in the specified company' });
    }
    const updatedProcess = { ...processes[processIndex], ...processData };
    processes[processIndex] = updatedProcess;
    res.json(updatedProcess);
};

const deleteProcess = (req, res) => {
    const { id } = req.params;
    let companyId;

    // Superadmins must pass companyId in the query string, other users use their own companyId
    if (req.user.role === 'superadmin') {
        companyId = req.query.companyId;
    } else {
        companyId = req.user.companyId;
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    if (!hasPermission(req.user.role, 'processes', 'delete', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete processes.' });
    }

    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);

    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found in the specified company' });
    }

    processes.splice(processIndex, 1);

    // Also remove the deleted process from any childProcess arrays
    processes.forEach(p => {
        if (p.childProcesses) {
            p.childProcesses = p.childProcesses.filter(child => child.id !== id);
        }
    });

    res.status(204).send();
};

module.exports = {
    getProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    calculateAllProcessStates
};