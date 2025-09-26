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
            processType: 'Padre',
            fillType: 'Valores',
            startTime: '21:00',
            endTime: '23:00',
            frequency: 'Personalizado',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            values: [],
            subprocesses: []
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

// Processes
app.get('/api/processes', (req, res) => {
    const { companyId } = req.query;
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const processes = processesByCompany[companyId] || [];
    res.json(processes); // Client will handle status calculation
});

app.post('/api/processes', (req, res) => {
    const { companyId, processData } = req.body;
    if (!companyId || !processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'companyId and process data (including id and name) are required' });
    }
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    // Standardize the process object
    const newProcess = {
        ...processData,
        criticidad: processData.criticidad || 'Baja',
        mode: processData.mode || 'Individual',
        internalPhases: processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: processData.values || [] }],
        childProcesses: processData.childProcesses || [],
        exclusiveDependency: processData.exclusiveDependency || false,
    };
    delete newProcess.values; // Clean up old field

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
    // Standardize the updated process object
    const updatedProcess = {
        ...processData,
        criticidad: processData.criticidad || 'Baja',
        mode: processData.mode || 'Individual',
        internalPhases: processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: processData.values || [] }],
        childProcesses: processData.childProcesses || [],
        exclusiveDependency: processData.exclusiveDependency || false,
    };
    delete updatedProcess.values; // Clean up old field

    processes[processIndex] = updatedProcess;
    res.json(updatedProcess);
});

app.delete('/api/processes/:id', (req, res) => {
    const { id } = req.params;
    const { companyId } = req.query; // companyId from query string
    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found' });
    }
    processes.splice(processIndex, 1);

    // Also delete associated child processes if they exist in other processes
    processes.forEach(p => {
        if (p.childProcesses) {
            p.childProcesses = p.childProcesses.filter(childId => childId !== id);
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
    const processMap = new Map(processes.map(p => [p.id, p]));

    const calculatedStates = new Map();
    const getStatus = (procId) => {
        if (calculatedStates.has(procId)) return calculatedStates.get(procId);

        const proc = processMap.get(procId);
        if (!proc) return 'sin ejecucion';

        if (proc.exclusiveDependency && proc.childProcesses && proc.childProcesses.length > 0) {
            const childStatus = getStatus(proc.childProcesses[0]);
            calculatedStates.set(procId, childStatus);
            return childStatus;
        }

        const relevantRegistrations = registrations
            .filter(r => r.processId === procId)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (relevantRegistrations.length === 0) {
            calculatedStates.set(procId, 'sin ejecucion');
            return 'sin ejecucion';
        }

        const latestRegistration = relevantRegistrations[0];
        const statusField = latestRegistration.values.find(v => v.name.toLowerCase() === 'status');
        const status = statusField ? statusField.value.toLowerCase() : 'sin ejecucion';
        calculatedStates.set(procId, status);
        return status;
    };

    processes.forEach(p => getStatus(p.id));

    const summary = {
        total: processes.length,
        ok: 0,
        falla: 0,
        ambar: 0,
        error: 0,
        sinEjecucion: 0,
        criticidad: { alta: 0, media: 0, baja: 0 }
    };

    processes.forEach(proc => {
        const status = calculatedStates.get(proc.id) || 'sin ejecucion';
        if (status === 'ok') summary.ok++;
        else if (status === 'falla') summary.falla++;
        else if (status === 'ambar') summary.ambar++;
        else if (status === 'error') summary.error++;
        else summary.sinEjecucion++;

        const criticidad = proc.criticidad ? proc.criticidad.toLowerCase() : 'baja';
        if (criticidad === 'alta') summary.criticidad.alta++;
        else if (criticidad === 'media') summary.criticidad.media++;
        else if (criticidad === 'baja') summary.criticidad.baja++;
    });

    res.json(summary);
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
