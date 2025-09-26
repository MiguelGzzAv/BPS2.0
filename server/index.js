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
    const registrations = registrationsByCompany[companyId] || [];

    const today = new Date().toISOString().slice(0, 10); // Get YYYY-MM-DD

    const processesWithStatus = processes.map(proc => {
        // Find the most recent registration for this process for today
        const relevantRegistrations = registrations
            .filter(r => r.processId === proc.id && r.timestamp.startsWith(today))
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        let status = 'POR INICIAR';
        // Find the field in the process definition that is designated as the status field
        const statusDefinitionField = proc.values.find(def => def.type === 'status');

        if (statusDefinitionField && relevantRegistrations.length > 0) {
            // Now find the value for that specific field name in the latest registration
            const statusValueField = relevantRegistrations[0].values.find(v => v.name === statusDefinitionField.name);
            if (statusValueField && statusValueField.value) {
                status = statusValueField.value;
            }
        }

        const safeProc = { ...proc };
        if (!Array.isArray(safeProc.values)) {
            safeProc.values = [];
        }
        return { ...safeProc, status };
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

    const newProcess = {
        ...processData,
        days: processData.days || [],
        values: processData.values || [],
        subprocesses: processData.subprocesses || []
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

    const updatedProcess = {
        ...processes[processIndex],
        ...processData
    };

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
app.post('/api/registrations', (req, res) => {
    const { companyId, processId, timestamp, values } = req.body;
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
        values
    };

    registrationsByCompany[companyId].push(newRegistration);
    console.log(`Added new registration to company ${companyId}:`, newRegistration);
    res.status(201).json(newRegistration);
});


// Summary
app.get('/api/summary', (req, res) => {
    const { companyId, date } = req.query;
    if (!companyId || !date) {
        return res.status(400).json({ error: 'companyId and date are required' });
    }

    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];

    const summary = {
        ok: { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        falla: { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        error: { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        ambar: { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } },
        'sin ejecucion': { total: 0, Alta: 0, Media: 0, Baja: 0, processes: { Alta: [], Media: [], Baja: [] } }
    };

    const relevantRegistrationsForDate = registrations.filter(r => r.timestamp.startsWith(date));

    processes.forEach(proc => {
        // 1. Determine status
        let status = 'sin ejecucion'; // Default status
        const statusDefinitionField = (proc.values || []).find(def => def.type === 'status');

        const relevantRegistrationsForProc = relevantRegistrationsForDate
            .filter(r => r.processId === proc.id)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (statusDefinitionField && relevantRegistrationsForProc.length > 0) {
            const latestRegistration = relevantRegistrationsForProc[0];
            const statusValueField = latestRegistration.values.find(v => v.name === statusDefinitionField.name);
            if (statusValueField && statusValueField.value) {
                // Normalize status to lowercase to match keys in summary object
                const foundStatus = statusValueField.value.toLowerCase();
                if (summary.hasOwnProperty(foundStatus)) {
                    status = foundStatus;
                }
            }
        }

        // 2. Get Criticidad
        const criticidad = proc.criticidad || 'Baja'; // Default to 'Baja' if not defined

        // 3. Update summary object
        if (summary[status]) {
            summary[status].total++;
            if (summary[status][criticidad] !== undefined) {
                summary[status][criticidad]++;
                if (summary[status].processes[criticidad]) {
                    summary[status].processes[criticidad].push(proc.name);
                }
            }
        }
    });

    res.json({ summary });
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
