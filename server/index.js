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
// --- Mock Data ---
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayISO = yesterday.toISOString();

const registrationsByCompany = {
    '1': [
        {
            id: 12345,
            processId: 'PRO7032',
            timestamp: yesterdayISO,
            values: [
                { name: 'Status', value: 'ok' },
                { name: 'Responsable', value: 'Jane Smith' }
            ]
        }
    ]
};

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
    const registrations = registrationsByCompany[companyId] || [];

    const today = new Date().toISOString().slice(0, 10); // Get YYYY-MM-DD

    const processesWithStatus = processes.map(proc => {
        // Find the most recent registration for this process for today
        const relevantRegistrations = registrations
            .filter(r => r.processId === proc.id && r.timestamp.startsWith(today))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let status = 'POR INICIAR';
        let registrationId = null;
        let registrationTimestamp = null;

        if (relevantRegistrations.length > 0) {
            const latestRegistration = relevantRegistrations[0];
            registrationId = latestRegistration.id;
            registrationTimestamp = latestRegistration.timestamp;
            const statusDefinitionField = (proc.values || []).find(def => def.type === 'status');
            if (statusDefinitionField) {
                const statusValueField = latestRegistration.values.find(v => v.name === statusDefinitionField.name);
                if (statusValueField && statusValueField.value) {
                    status = statusValueField.value;
                } else {
                    status = 'Sin Ejecucion';
                }
            } else {
                status = 'Sin Ejecucion';
            }
        }

        const safeProc = { ...proc };
        if (!Array.isArray(safeProc.values)) {
            safeProc.values = [];
        }
        return { ...safeProc, status, registrationId, registrationTimestamp };
    });

    res.json(processesWithStatus);
});

app.post('/api/processes', (req, res) => {
    const { companyId, processData } = req.body;
    if (!companyId || !processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'companyId and process data (including id and name) are required' });
    }
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    // Ensure the values property is always an array
    if (!Array.isArray(processData.values)) {
        processData.values = [];
    }
    processesByCompany[companyId].push(processData);
    res.status(201).json(processData);
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
    processes[processIndex] = processData;
    res.json(processData);
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
    res.status(204).send();
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
    // In a real app, hash the password here. For now, storing plain text.
    usersByCompany[companyId].push(newUser);
    console.log(`Added new user to company ${companyId}:`, newUser);
    res.status(201).json(newUser);
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

// Registrations
app.post('/api/registrations', (req, res) => {
    const { companyId, processId, timestamp, values } = req.body;

    if (!companyId || !processId || !values) {
        return res.status(400).json({ error: 'companyId, processId, and values are required' });
    }

    if (!registrationsByCompany[companyId]) {
        registrationsByCompany[companyId] = [];
    }

    const newRegistration = {
        id: Date.now(), // Simple unique ID for the registration
        processId,
        timestamp,
        values
    };

    registrationsByCompany[companyId].push(newRegistration);
    console.log(`Added new registration to company ${companyId}:`, newRegistration);
    res.status(201).json(newRegistration);
});

app.put('/api/registrations/:id', (req, res) => {
    const { id } = req.params;
    const { companyId, values } = req.body;

    if (!companyId || !values) {
        return res.status(400).json({ error: 'companyId and values are required' });
    }

    const registrations = registrationsByCompany[companyId] || [];
    const registrationIndex = registrations.findIndex(r => r.id == id);

    if (registrationIndex === -1) {
        return res.status(404).json({ error: 'Registration not found' });
    }

    // Check if it's been more than 24 hours
    const registrationTime = new Date(registrations[registrationIndex].timestamp);
    const now = new Date();
    const diffHours = (now - registrationTime) / (1000 * 60 * 60);

    if (diffHours > 24) {
        return res.status(403).json({ error: 'Cannot edit a registration after 24 hours' });
    }

    registrations[registrationIndex].values = values;
    registrations[registrationIndex].timestamp = new Date().toISOString(); // Update timestamp on edit

    console.log(`Updated registration ${id} for company ${companyId}:`, registrations[registrationIndex]);
    res.json(registrations[registrationIndex]);
});

app.get('/api/registrations/:id', (req, res) => {
    const { id } = req.params;
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ error: 'companyId is required' });
    }

    const registrations = registrationsByCompany[companyId] || [];
    const registration = registrations.find(r => r.id == id);

    if (!registration) {
        return res.status(404).json({ error: 'Registration not found' });
    }

    res.json(registration);
});

app.get('/api/summary', (req, res) => {
    const { companyId, date } = req.query;

    if (!companyId || !date) {
        return res.status(400).json({ error: 'companyId and date are required' });
    }

    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];

    const summary = {
        'ok': 0,
        'falla': 0,
        'error': 0,
        'ambar': 0,
        'sin ejecucion': 0
    };

    const dailyRegistrations = registrations.filter(r => r.timestamp.startsWith(date));
    const registeredProcessIds = new Set(dailyRegistrations.map(r => r.processId));

    dailyRegistrations.forEach(reg => {
        const process = processes.find(p => p.id === reg.processId);
        if (!process) return;

        const statusField = (process.values || []).find(f => f.type === 'status');
        if (!statusField) return;

        const registrationValue = reg.values.find(v => v.name === statusField.name);
        if (registrationValue && registrationValue.value) {
            const status = registrationValue.value.toLowerCase();
            if (summary.hasOwnProperty(status)) {
                summary[status]++;
            }
        }
    });

    const totalProcesses = processes.length;
    const runProcesses = registeredProcessIds.size;
    summary['sin ejecucion'] = totalProcesses - runProcesses;

    res.json({ date, summary });
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
