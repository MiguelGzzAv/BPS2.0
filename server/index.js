const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// --- Mock Data ---
const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];
const processesByCompany = {
    '1': [
        {
            id: 'PRO7032',
            name: 'PROCESO NOCTURNO BANORTE',
            criticidad: 'Alta',
            startTime: '21:00',
            endTime: '23:00',
            frequency: 'Diario',
            days: [],
            mode: 'Individual', // Changed from Padre
            internalPhases: [
                { name: 'default', fields: [{ name: 'Status', type: 'status' }, {name: 'Comentarios', type: 'text'}] }
            ],
            childProcesses: [{ id: 'PRO7033', dependency: true }] // New structure
        },
        {
            id: 'PRO7033',
            name: 'REPORTE DIARIO',
            criticidad: 'Media',
            startTime: '22:00',
            endTime: '22:30',
            frequency: 'Diario',
            days: [],
            mode: 'Individual',
            internalPhases: [
                { name: 'default', fields: [{ name: 'Status', type: 'status' }] }
            ],
            childProcesses: []
        },
        {
            id: 'PRO7034',
            name: 'PROCESO DE FACTURACION',
            criticidad: 'Baja',
            startTime: '10:00',
            endTime: '12:00',
            frequency: 'Diario',
            days: [],
            mode: 'Multiple',
            internalPhases: [
                { name: 'Generar Facturas', fields: [{ name: 'Status', type: 'status' }, { name: 'Facturas Generadas', type: 'number' }] },
                { name: 'Enviar a Clientes', fields: [{ name: 'Status', type: 'status' }, { name: 'Correos Enviados', type: 'number' }] },
                { name: 'Confirmar Recepcion', fields: [{ name: 'Status', type: 'status' }] }
            ],
            childProcesses: []
        }
    ],
    '2': []
};
const usersByCompany = {
    '1': [
        { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', username: 'johndoe', password: 'password123', groupId: 1 },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', username: 'janesmith', password: 'password123', groupId: 2 }
    ]
};
const groupsByCompany = {
    '1': [
        { id: 1, name: 'Administrators' },
        { id: 2, name: 'Operators' }
    ]
};
const departmentsByCompany = {
    '1': [
        { id: 1, name: 'Human Resources' },
        { id: 2, name: 'IT' }
    ]
};
const registrationsByCompany = {};
const escalationsByCompany = {};

// --- Middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies

// --- API Routes ---
// Companies
app.get('/api/companies', (req, res) => {
    res.json(companies);
});

app.get('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const company = companies.find(c => c.id === parseInt(id));
    if (company) {
        res.json(company);
    } else {
        res.status(404).json({ error: 'Company not found' });
    }
});

app.post('/api/companies', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    const newCompany = { id: newId, name };
    companies.push(newCompany);
    res.status(201).json(newCompany);
});

app.delete('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const companyIndex = companies.findIndex(c => c.id === parseInt(id));
    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }
    companies.splice(companyIndex, 1);
    res.status(204).send();
});

app.put('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const company = companies.find(c => c.id === parseInt(id));
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    company.name = name;
    res.json(company);
});

// --- Status Calculation Logic ---
const calculateAllProcessStates = (processes, registrations) => {
    const processMap = new Map(processes.map(p => [p.id, p]));
    const calculatedStates = new Map();

    const getOwnStatus = (procId) => {
        const relevantRegistrations = registrations
            .filter(r => r.processId === procId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (relevantRegistrations.length === 0) return 'sin ejecucion';

        const proc = processMap.get(procId);
        if (!proc || !proc.internalPhases) return 'sin ejecucion';

        // Iterate through registrations from newest to oldest
        for (const reg of relevantRegistrations) {
            const phaseName = reg.phase || 'default';
            const phaseDef = proc.internalPhases.find(p => p.name === phaseName);

            if (phaseDef && phaseDef.fields) {
                // Find the field defined with type 'status' in the process definition
                const statusFieldDef = phaseDef.fields.find(f => f.type === 'status');
                if (statusFieldDef) {
                    const statusFieldName = statusFieldDef.name;
                    // Look for a value for that field in the current registration
                    const statusValue = reg.values.find(v => v.name === statusFieldName);
                    if (statusValue && statusValue.value) {
                        return statusValue.value.toLowerCase(); // Found the latest status, return it.
                    }
                }
            }
        }

        return 'sin ejecucion'; // No registration with a status field found
    };

    const getStatus = (procId) => {
        if (calculatedStates.has(procId)) return calculatedStates.get(procId);

        const proc = processMap.get(procId);
        if (!proc) return 'sin ejecucion';

        const statusPriority = { 'error': 4, 'falla': 3, 'ambar': 2, 'ok': 1, 'sin ejecucion': 0, 'por iniciar': 0 };
        let mostCriticalChildStatus = 'sin ejecucion';
        let hasDependentChildren = false;

        if (proc.childProcesses && proc.childProcesses.length > 0) {
            proc.childProcesses.forEach(child => {
                if (child.dependency) {
                    hasDependentChildren = true;
                    const childStatus = getStatus(child.id);
                    if (statusPriority[childStatus] > statusPriority[mostCriticalChildStatus]) {
                        mostCriticalChildStatus = childStatus;
                    }
                }
            });
        }

        let finalStatus;
        // If there are dependent children AND at least one has a real status, the parent's status is the most critical child status.
        if (hasDependentChildren && mostCriticalChildStatus !== 'sin ejecucion') {
            finalStatus = mostCriticalChildStatus;
        } else {
            // Otherwise, the parent calculates its own status from its registrations.
            finalStatus = getOwnStatus(proc.id);
        }

        calculatedStates.set(procId, finalStatus);
        return finalStatus;
    };

    processes.forEach(p => getStatus(p.id));
    return calculatedStates;
};


// --- Process API Routes ---
app.get('/api/processes', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];
    const states = calculateAllProcessStates(processes, registrations);

    const processesWithStatus = processes.map(p => ({
        ...p,
        status: states.get(p.id) || 'sin ejecucion'
    }));

    res.json(processesWithStatus);
});

app.post('/api/processes', (req, res) => {
    const { companyId, processData } = req.body;
    if (!companyId || !processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'companyId and process data are required' });
    }
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    // Remove obsolete field and set defaults
    delete processData.exclusiveDependency;
    const newProcess = {
        ...processData,
        criticidad: processData.criticidad || 'Baja',
        mode: processData.mode || 'Individual',
        internalPhases: processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: [] }],
        childProcesses: processData.childProcesses || [],
    };

    processesByCompany[companyId].push(newProcess);
    res.status(201).json(newProcess);
});

app.put('/api/processes/:id', (req, res) => {
    const { id } = req.params;
    const { companyId, processData } = req.body;
    if (!companyId || !processData) {
        return res.status(400).json({ error: 'companyId and processData are required' });
    }
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found' });
    }
    // Remove obsolete field
    delete processData.exclusiveDependency;
    const updatedProcess = { ...processes[processIndex], ...processData };

    processes[processIndex] = updatedProcess;
    res.json(updatedProcess);
});

app.delete('/api/processes/:id', (req, res) => {
    const { id } = req.params;
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found' });
    }
    processes.splice(processIndex, 1);

    // Also remove the deleted process from any parent's child list
    processes.forEach(p => {
        if (p.childProcesses) {
            p.childProcesses = p.childProcesses.filter(child => child.id !== id);
        }
    });

    res.status(204).send();
});

// Summary for Dashboard
app.get('/api/summary', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }

    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];
    const calculatedStates = calculateAllProcessStates(processes, registrations);

    // Initialize the summary object in the structure the frontend expects
    const summary = {
        'ok': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'falla': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'error': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'ambar': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'sin ejecucion': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
    };

    processes.forEach(proc => {
        const status = calculatedStates.get(proc.id) || 'sin ejecucion';
        const criticality = proc.criticidad || 'Baja'; // Default to Baja if not specified

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

    // The frontend expects the data to be in a 'summary' property
    res.json({ summary });
});

// Affected Processes for Dashboard
app.get('/api/affected-processes', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
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
                // Check if the child has a dependency and is in a failed state
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
                        // A parent is listed once, even if multiple children fail.
                        // We break to avoid duplicate entries for the same parent from different children.
                        break;
                    }
                }
            }
        }
    });

    res.json(affectedParents);
});


// Users
app.get('/api/users', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const users = usersByCompany[companyId] || [];
    res.json(users);
});

app.post('/api/users', (req, res) => {
    const { companyId, ...newUser } = req.body;
    if (!companyId || !newUser.username || !newUser.name) {
        return res.status(400).json({ error: 'companyId, username, and name are required' });
    }
    if (!usersByCompany[companyId]) {
        usersByCompany[companyId] = [];
    }
    const userToSave = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        password: newUser.password, // In a real app, hash this
        groupId: newUser.groupId
    };

    usersByCompany[companyId].push(userToSave);
    console.log(`Added new user to company ${companyId}:`, userToSave);
    res.status(201).json(userToSave);
});

// Groups
app.get('/api/groups', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const groups = groupsByCompany[companyId] || [];
    res.json(groups);
});

app.post('/api/groups', (req, res) => {
    const { companyId, ...newGroup } = req.body;
    if (!companyId || !newGroup.name) {
        return res.status(400).json({ error: 'companyId and group name are required' });
    }
    if (!groupsByCompany[companyId]) {
        groupsByCompany[companyId] = [];
    }
    newGroup.id = Date.now(); // Simple unique ID
    groupsByCompany[companyId].push(newGroup);
    console.log(`Added new group to company ${companyId}:`, newGroup);
    res.status(201).json(newGroup);
});

// Departments
app.get('/api/departments', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const departments = departmentsByCompany[companyId] || [];
    res.json(departments);
});

app.post('/api/departments', (req, res) => {
    const { companyId, ...newDepartment } = req.body;
    if (!companyId || !newDepartment.name) {
        return res.status(400).json({ error: 'companyId and department name are required' });
    }
    if (!departmentsByCompany[companyId]) {
        departmentsByCompany[companyId] = [];
    }
    newDepartment.id = Date.now(); // Simple unique ID
    departmentsByCompany[companyId].push(newDepartment);
    console.log(`Added new department to company ${companyId}:`, newDepartment);
    res.status(201).json(newDepartment);
});


// Escalations
app.get('/api/escalations', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const escalations = escalationsByCompany[companyId] || [];
    res.json(escalations);
});

app.post('/api/escalations', (req, res) => {
    const { companyId, ...newRule } = req.body;
    if (!companyId || !newRule.processId || !newRule.userId) {
        return res.status(400).json({ error: 'companyId, processId, and userId are required' });
    }
    if (!escalationsByCompany[companyId]) {
        escalationsByCompany[companyId] = [];
    }
    newRule.id = Date.now(); // Simple unique ID
    escalationsByCompany[companyId].push(newRule);
    console.log(`Added new escalation rule to company ${companyId}:`, newRule);
    res.status(201).json(newRule);
});

app.delete('/api/escalations/:id', (req, res) => {
    const { id } = req.params;
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const escalations = escalationsByCompany[companyId] || [];
    const ruleIndex = escalations.findIndex(r => r.id === parseInt(id));
    if (ruleIndex === -1) {
        return res.status(404).json({ error: 'Escalation rule not found' });
    }
    escalations.splice(ruleIndex, 1);
    res.status(204).send();
});


// Registrations
app.get('/api/registrations', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const registrations = registrationsByCompany[companyId] || [];
    res.json(registrations);
});

app.post('/api/registrations', (req, res) => {
    const { companyId, processId, timestamp, values, phase } = req.body;
    if (!companyId || !processId || !timestamp || !values) {
        return res.status(400).json({ error: 'companyId, processId, timestamp, and values are required' });
    }

    if (!registrationsByCompany[companyId]) {
        registrationsByCompany[companyId] = [];
    }

    const newRegistration = {
        id: Date.now(), // Add a unique ID for the registration itself
        processId,
        timestamp,
        values,
        phase: phase || 'default' // Capture the phase, default if not provided
    };

    registrationsByCompany[companyId].push(newRegistration);
    console.log(`Added new registration to company ${companyId}:`, newRegistration);
    res.status(201).json(newRegistration);
});


// --- Static Files ---
app.use(express.static(path.join(__dirname, '../client')));


// --- Page-serving Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '12345') {
        res.redirect('/selection.html');
    } else {
        res.send('Invalid username or password');
    }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});