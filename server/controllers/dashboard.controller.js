const db = require('../db');
const { assembleProcessObjects, calculateAllProcessStates } = require('../utils/processUtils');

// --- Helper to fetch all process-related data for a company ---
const fetchProcessDataForCompany = async (companyId) => {
    const [processRes, phaseRes, fieldRes, depRes, regRes] = await Promise.all([
        db.query('SELECT id, name, criticidad, start_time, end_time, frequency, days, mode FROM processes WHERE company_id = $1', [companyId]),
        db.query('SELECT ip.id, ip.process_id, ip.name, ip.phase_order FROM internal_phases ip JOIN processes p ON ip.process_id = p.id WHERE p.company_id = $1', [companyId]),
        db.query('SELECT pf.id, pf.phase_id, pf.name, pf.type, pf.field_order FROM phase_fields pf JOIN internal_phases ip ON pf.phase_id = ip.id JOIN processes p ON ip.process_id = p.id WHERE p.company_id = $1', [companyId]),
        db.query('SELECT pd.parent_process_id, pd.child_process_id, pd.dependency FROM process_dependencies pd JOIN processes p ON pd.parent_process_id = p.id WHERE p.company_id = $1', [companyId]),
        db.query('SELECT process_id AS "processId", phase, "values", "timestamp" FROM registrations WHERE company_id = $1', [companyId])
    ]);

    const processes = assembleProcessObjects(processRes.rows, phaseRes.rows, fieldRes.rows, depRes.rows);
    const registrations = regRes.rows;

    return { processes, registrations };
};


const getSummary = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.json({ summary: {} }); // Return empty summary if no companyId
        }

        const { date } = req.query;
        const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
        if (!date) forDate.setUTCHours(0, 0, 0, 0);

        const { processes, registrations } = await fetchProcessDataForCompany(companyId);
        const calculatedStates = calculateAllProcessStates(processes, registrations, forDate);

        const processesByStatus = { 'ok': [], 'falla': [], 'error': [], 'ambar': [], 'sin ejecucion': [] };
        processes.forEach(proc => {
            const status = calculatedStates.get(proc.id) || 'sin ejecucion';
            if (processesByStatus[status]) processesByStatus[status].push(proc);
        });

        const finalSummary = {};
        const criticalityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
        for (const status in processesByStatus) {
            const processGroup = processesByStatus[status];
            const sortedProcesses = [...processGroup].sort((a, b) => (criticalityOrder[a.criticidad] || 4) - (criticalityOrder[b.criticidad] || 4));
            finalSummary[status] = {
                total: processGroup.length,
                Alta: processGroup.filter(p => p.criticidad === 'Alta').length,
                Media: processGroup.filter(p => p.criticidad === 'Media').length,
                Baja: processGroup.filter(p => p.criticidad === 'Baja').length,
                processes: sortedProcesses.slice(0, 5).map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time })),
            };
        }
        res.json({ summary: finalSummary });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getAffectedProcesses = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.json([]);
        }

        const { date } = req.query;
        const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
        if (!date) forDate.setUTCHours(0, 0, 0, 0);

        const { processes, registrations } = await fetchProcessDataForCompany(companyId);
        if (processes.length === 0) return res.json([]);

        const calculatedStates = calculateAllProcessStates(processes, registrations, forDate);
        const processMap = new Map(processes.map(p => [p.id, p]));

        const affectedParents = [];
        processes.forEach(parent => {
            if (parent.childProcesses && parent.childProcesses.length > 0) {
                for (const childRef of parent.childProcesses) {
                    if (childRef.dependency) {
                        const childStatus = calculatedStates.get(childRef.id);
                        if (childStatus === 'falla' || childStatus === 'error') {
                            const childProcess = processMap.get(childRef.id);
                            affectedParents.push({
                                parentProcessId: parent.id,
                                parentProcessName: parent.name,
                                failingChildId: childRef.id,
                                failingChildName: childProcess ? childProcess.name : 'Unknown',
                                childStatus: childStatus
                            });
                            break;
                        }
                    }
                }
            }
        });
        res.json(affectedParents);
    } catch (error) {
        console.error('Error fetching affected processes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getProcessesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }
        if (!status) {
            return res.status(400).json({ error: 'A status parameter is required.' });
        }

        const { date } = req.query;
        const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
        if (!date) forDate.setUTCHours(0, 0, 0, 0);

        const { processes, registrations } = await fetchProcessDataForCompany(companyId);
        const calculatedStates = calculateAllProcessStates(processes, registrations, forDate);

        const filteredProcesses = processes.filter(proc => (calculatedStates.get(proc.id) || 'sin ejecucion') === status);

        const criticalityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
        const sortedProcesses = [...filteredProcesses].sort((a, b) => {
            const critA = criticalityOrder[a.criticidad] || 4;
            const critB = criticalityOrder[b.criticidad] || 4;
            return critA - critB;
        }).map(p => ({ ...p, startTime: p.start_time, endTime: p.end_time }));

        res.json(sortedProcesses);
    } catch (error) {
        console.error(`Error fetching processes for status ${req.params.status}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getSummary,
    getAffectedProcesses,
    getProcessesByStatus
};