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
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, registrations);

    const summary = {
        'ok': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'falla': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'error': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'ambar': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'sin ejecucion': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
    };

    processes.forEach(proc => {
        const status = calculatedStates.get(proc.id) || 'sin ejecucion';
        const criticality = proc.criticidad || 'Baja';

        if (summary[status]) {
            summary[status].total++;
            if (summary[status][criticality] !== undefined) {
                summary[status][criticality]++;
                if (summary[status].processes[criticality]) {
                    summary[status].processes[criticality].push(proc.name);
                }
            }
        }
    });

    res.json({ summary });
};

const getAffectedProcesses = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    const processes = processesByCompany[companyId] || [];
    if (processes.length === 0) {
        return res.json([]);
    }

    const registrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, registrations);
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

module.exports = {
    getSummary,
    getAffectedProcesses
};