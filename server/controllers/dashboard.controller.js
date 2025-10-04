const { processesByCompany, registrationsByCompany } = require('../data/database');
const { calculateAllProcessStates } = require('../controllers/process.controller');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

const getSummary = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.json({ summary: {} }); // Return empty summary if no companyId
    }

    const { date } = req.query;
    const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
    if (!date) forDate.setUTCHours(0, 0, 0, 0);

    const processes = processesByCompany[companyId] || [];
    const allRegistrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, allRegistrations, forDate);

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
            processes: sortedProcesses.slice(0, 5), // Keep the top 5 for the main view
        };
    }
    res.json({ summary: finalSummary });
};

const getAffectedProcesses = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.json([]); // Return empty array if no company is selected
    }

    const { date } = req.query;
    const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
    if (!date) forDate.setUTCHours(0, 0, 0, 0);

    const processes = processesByCompany[companyId] || [];
    if (processes.length === 0) return res.json([]);

    const allRegistrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, allRegistrations, forDate);
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
};

const getProcessesByStatus = (req, res) => {
    const { status } = req.params;
    const companyId = getCompanyId(req);

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    if (!status) {
        return res.status(400).json({ error: 'A status parameter is required.' });
    }

    const { date } = req.query;
    const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
    if (!date) {
        forDate.setUTCHours(0, 0, 0, 0);
    }

    const processes = processesByCompany[companyId] || [];
    const allRegistrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, allRegistrations, forDate);

    const filteredProcesses = processes.filter(proc => (calculatedStates.get(proc.id) || 'sin ejecucion') === status);

    const criticalityOrder = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
    const sortedProcesses = [...filteredProcesses].sort((a, b) => {
        const critA = criticalityOrder[a.criticidad] || 4;
        const critB = criticalityOrder[b.criticidad] || 4;
        return critA - critB;
    });

    res.json(sortedProcesses);
};

module.exports = {
    getSummary,
    getAffectedProcesses,
    getProcessesByStatus
};