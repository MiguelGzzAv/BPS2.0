const express = require('express');
const path = require('path');
const session = require('express-session');
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
            mode: 'Individual',
            internalPhases: [
                { name: 'default', fields: [{ name: 'Status', type: 'status' }, {name: 'Comentarios', type: 'text'}] }
            ],
            childProcesses: [{ id: 'PRO7033', dependency: true }]
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
        }
    ],
    '2': []
};
const usersByCompany = {
    '1': [
        { id: 1, name: 'Admin User', email: 'admin@example.com', phone: '123-456-7890', username: 'admin', password: 'password', groupId: 1 },
        { id: 2, name: 'Operator User', email: 'op@example.com', phone: '098-765-4321', username: 'operator', password: 'password', groupId: 2 },
        { id: 3, name: 'Reader User', email: 'reader@example.com', phone: '111-222-3333', username: 'reader', password: 'password', groupId: 3 }
    ]
};
const groupsByCompany = {
    '1': [
        { id: 1, name: 'Administrator' },
        { id: 2, name: 'Operator' },
        { id: 3, name: 'Reader' }
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
app.use(express.json());
app.use(session({
    secret: 'your-secret-key-that-is-long-and-secure',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- Auth API Routes ---
const findUserByUsername = (username) => {
    for (const companyId in usersByCompany) {
        const user = usersByCompany[companyId].find(u => u.username === username);
        if (user) {
            return { ...user, companyId };
        }
    }
    return null;
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (user && user.password === password) {
        const companyGroups = groupsByCompany[user.companyId] || [];
        const group = companyGroups.find(g => g.id === user.groupId);
        const role = group ? group.name : 'Reader';

        req.session.user = {
            id: user.id,
            username: user.username,
            companyId: user.companyId,
            role: role
        };
        res.json({ success: true, user: req.session.user });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/api/session', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- Authorization Middleware ---
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
};

const hasPermission = (allowedRoles) => {
    return (req, res, next) => {
        const userRole = req.session.user.role;
        if (allowedRoles.includes(userRole)) {
            return next();
        }
        res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
    };
};

const canWrite = hasPermission(['Administrator', 'Operator']);
const canAdmin = hasPermission(['Administrator']);

// Apply authentication middleware to all API routes below
app.use('/api', isAuthenticated);

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

app.post('/api/companies', canAdmin, (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    const newCompany = { id: newId, name };
    companies.push(newCompany);
    res.status(201).json(newCompany);
});

app.delete('/api/companies/:id', canAdmin, (req, res) => {
    const { id } = req.params;
    const companyIndex = companies.findIndex(c => c.id === parseInt(id));
    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }
    companies.splice(companyIndex, 1);
    res.status(204).send();
});

app.put('/api/companies/:id', canAdmin, (req, res) => {
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
        let hasActiveDependentChildren = false;

        if (proc.childProcesses && proc.childProcesses.length > 0) {
            proc.childProcesses.forEach(child => {
                if (child.dependency) {
                    const childStatus = getStatus(child.id);
                    if (childStatus !== 'sin ejecucion') {
                        hasActiveDependentChildren = true;
                    }
                    if (statusPriority[childStatus] > statusPriority[mostCriticalChildStatus]) {
                        mostCriticalChildStatus = childStatus;
                    }
                }
            });
        }

        let finalStatus;
        if (hasActiveDependentChildren) {
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


// --- Protected API Routes ---
app.get('/api/processes', (req, res) => {
    const companyId = req.session.user.companyId;
    const processes = processesByCompany[companyId] || [];
    const registrations = registrationsByCompany[companyId] || [];
    const states = calculateAllProcessStates(processes, registrations);

    const processesWithStatus = processes.map(p => ({
        ...p,
        status: states.get(p.id) || 'sin ejecucion'
    }));

    res.json(processesWithStatus);
});

app.post('/api/processes', canWrite, (req, res) => {
    const companyId = req.session.user.companyId;
    const { processData } = req.body;
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    processesByCompany[companyId].push(processData);
    res.status(201).json(processData);
});

app.put('/api/processes/:id', canWrite, (req, res) => {
    const { id } = req.params;
    const companyId = req.session.user.companyId;
    const { processData } = req.body;
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found' });
    }
    processes[processIndex] = { ...processes[processIndex], ...processData };
    res.json(processes[processIndex]);
});

app.delete('/api/processes/:id', canWrite, (req, res) => {
    const { id } = req.params;
    const companyId = req.session.user.companyId;
    const processes = processesByCompany[companyId] || [];
    const processIndex = processes.findIndex(p => p.id === id);
    if (processIndex === -1) {
        return res.status(404).json({ error: 'Process not found' });
    }
    processes.splice(processIndex, 1);
    res.status(204).send();
});

app.get('/api/users', (req, res) => {
    const companyId = req.session.user.companyId;
    const users = usersByCompany[companyId] || [];
    res.json(users);
});

app.post('/api/users', canAdmin, (req, res) => {
    const companyId = req.session.user.companyId;
    const { ...newUser } = req.body;
    if (!usersByCompany[companyId]) {
        usersByCompany[companyId] = [];
    }
    const userToSave = { id: Date.now(), ...newUser };
    usersByCompany[companyId].push(userToSave);
    res.status(201).json(userToSave);
});

app.get('/api/groups', (req, res) => {
    const companyId = req.session.user.companyId;
    const groups = groupsByCompany[companyId] || [];
    res.json(groups);
});

app.post('/api/groups', canAdmin, (req, res) => {
    const companyId = req.session.user.companyId;
    const { ...newGroup } = req.body;
    if (!groupsByCompany[companyId]) {
        groupsByCompany[companyId] = [];
    }
    const groupToSave = { id: Date.now(), ...newGroup };
    groupsByCompany[companyId].push(groupToSave);
    res.status(201).json(groupToSave);
});

app.get('/api/departments', (req, res) => {
    const companyId = req.session.user.companyId;
    const departments = departmentsByCompany[companyId] || [];
    res.json(departments);
});

app.post('/api/departments', canAdmin, (req, res) => {
    const companyId = req.session.user.companyId;
    const { ...newDepartment } = req.body;
    if (!departmentsByCompany[companyId]) {
        departmentsByCompany[companyId] = [];
    }
    const deptToSave = { id: Date.now(), ...newDepartment };
    departmentsByCompany[companyId].push(deptToSave);
    res.status(201).json(deptToSave);
});

app.get('/api/escalations', (req, res) => {
    const companyId = req.session.user.companyId;
    const escalations = escalationsByCompany[companyId] || [];
    res.json(escalations);
});

app.post('/api/escalations', canWrite, (req, res) => {
    const companyId = req.session.user.companyId;
    const { ...ruleData } = req.body;
    if (!escalationsByCompany[companyId]) {
        escalationsByCompany[companyId] = [];
    }
    const escalations = escalationsByCompany[companyId];
    const existingRuleIndex = ruleData.id ? escalations.findIndex(r => r.id === ruleData.id) : -1;
    if (existingRuleIndex > -1) {
        escalations[existingRuleIndex] = { ...escalations[existingRuleIndex], ...ruleData };
        res.status(200).json(escalations[existingRuleIndex]);
    } else {
        const newRule = { ...ruleData, id: Date.now() };
        escalations.push(newRule);
        res.status(201).json(newRule);
    }
});

app.delete('/api/escalations/:id', canWrite, (req, res) => {
    const { id } = req.params;
    const companyId = req.session.user.companyId;
    const escalations = escalationsByCompany[companyId] || [];
    const ruleIndex = escalations.findIndex(r => r.id === parseInt(id));
    if (ruleIndex === -1) {
        return res.status(404).json({ error: 'Escalation rule not found' });
    }
    escalations.splice(ruleIndex, 1);
    res.status(204).send();
});

app.get('/api/registrations', (req, res) => {
    const companyId = req.session.user.companyId;
    const registrations = registrationsByCompany[companyId] || [];
    res.json(registrations);
});

app.post('/api/registrations', canWrite, (req, res) => {
    const companyId = req.session.user.companyId;
    const { processId, timestamp, values, phase } = req.body;
    if (!registrationsByCompany[companyId]) {
        registrationsByCompany[companyId] = [];
    }
    const newRegistration = {
        id: Date.now(),
        processId,
        timestamp,
        values,
        phase: phase || 'default'
    };
    registrationsByCompany[companyId].push(newRegistration);
    res.status(201).json(newRegistration);
});

// --- Static Files ---
app.use(express.static(path.join(__dirname, '../client')));

// --- Page-serving Routes ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});