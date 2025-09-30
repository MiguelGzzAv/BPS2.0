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
// --- Unified User Data with Roles ---
const users = [
    // Super Admin
    { id: 1, name: 'Super Admin', username: 'superadmin', password: 'password123', role: 'superadmin' },

    // Company 1 (Banorte)
    { id: 2, name: 'Admin Banorte', username: 'admin_banorte', password: 'password123', role: 'admin', companyId: 1 },
    { id: 3, name: 'Operator Banorte', username: 'operator_banorte', password: 'password123', role: 'operator', companyId: 1 },
    { id: 4, name: 'Reader Banorte', username: 'reader_banorte', password: 'password123', role: 'reader', companyId: 1 },

    // Company 2 (Banamex)
    { id: 5, name: 'Admin Banamex', username: 'admin_banamex', password: 'password123', role: 'admin', companyId: 2 },
    { id: 6, name: 'Operator Banamex', username: 'operator_banamex', password: 'password123', role: 'operator', companyId: 2 },
    { id: 7, name: 'Reader Banamex', username: 'reader_banamex', password: 'password123', role: 'reader', companyId: 2 },
];
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

// --- Authorization Middleware ---
const authAndAuthzMiddleware = (req, res, next) => {
    // 1. AUTHENTICATION: Find the user from the header
    // In a real app, you'd parse a JWT. Here, we simulate with a header.
    const userId = req.headers['x-user-id'];
    if (!userId) {
        return res.status(401).json({ error: 'Authentication required. Please provide x-user-id header.' });
    }
    const user = users.find(u => u.id === parseInt(userId));
    if (!user) {
        return res.status(401).json({ error: 'Invalid user.' });
    }
    req.user = user; // Attach user to the request for use in subsequent handlers

    // 2. AUTHORIZATION: Check permissions based on role
    const { role, companyId } = user;
    const { method, path } = req;

    // Superadmin can do anything, so we let them pass immediately.
    if (role === 'superadmin') {
        return next();
    }

    // --- Company Data Integrity Check ---
    // For any request that includes a companyId in the query or body, it must match the user's companyId.
    // This prevents a user from trying to write data into another company's records.
    const requestedCompanyId = req.query.companyId || req.body.companyId;
    if (requestedCompanyId && parseInt(requestedCompanyId) !== companyId) {
        return res.status(403).json({ error: "Forbidden: You cannot specify a different company's ID." });
    }

    // --- Role-based Action Permissions ---
    if (role === 'reader') {
        // Readers can only perform GET requests.
        if (method !== 'GET') {
            return res.status(403).json({ error: 'Forbidden: Readers can only view data.' });
        }
    }

    if (role === 'operator') {
        // Operators can view data (GET) and submit specific operational data (POST).
        const allowedPostPaths = ['/api/registrations', '/api/escalations'];
        if (method !== 'GET' && !(method === 'POST' && allowedPostPaths.includes(path))) {
            return res.status(403).json({ error: 'Forbidden: Operators can only view data and create operational records.' });
        }
    }

    // Admins can perform all actions (GET, POST, PUT, DELETE) within their company.
    // The company ID check above and the data filtering in each route will enforce this.
    // No specific action block is needed here as they are allowed all methods.

    next();
};
app.use('/api', authAndAuthzMiddleware); // Apply middleware to all API routes

// --- API Routes ---
// All routes below are protected by the authAndAuthzMiddleware

// Helper to get companyId based on user role
const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        // For superadmin, companyId must be provided in the request query or body
        return req.query.companyId || req.body.companyId;
    }
    // For other roles, companyId is taken from their user profile
    return req.user.companyId;
};

// Companies - Mostly Superadmin territory
app.get('/api/companies', (req, res) => {
    if (req.user.role === 'superadmin') {
        res.json(companies);
    } else {
        // Non-superadmins only see their own company
        const userCompany = companies.find(c => c.id === req.user.companyId);
        res.json(userCompany ? [userCompany] : []);
    }
});

app.get('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    // Allow if superadmin, or if the requested company ID matches the user's company ID
    if (req.user.role !== 'superadmin' && req.user.companyId !== parseInt(id)) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own company.' });
    }
    const company = companies.find(c => c.id === parseInt(id));
    if (company) {
        res.json(company);
    } else {
        res.status(404).json({ error: 'Company not found' });
    }
});

// Company creation, deletion, and updating are restricted to Superadmin
app.post('/api/companies', (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can create companies.' });
    }
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
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can delete companies.' });
    }
    const { id } = req.params;
    const companyIndex = companies.findIndex(c => c.id === parseInt(id));
    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }
    companies.splice(companyIndex, 1);
    res.status(204).send();
});

app.put('/api/companies/:id', (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can update companies.' });
    }
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
            proc.childProcesses.forEach(childRef => {
                const childProc = processMap.get(childRef.id);
                // Only consider children that actually exist and have a dependency
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
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
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
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { processData } = req.body;
    if (!processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'Process data (including id and name) is required.' });
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
    const companyId = getCompanyId(req);
     if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { processData } = req.body;
    if (!processData) {
        return res.status(400).json({ error: 'processData is required' });
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
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
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
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
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


// --- User Management API ---
app.get('/api/users', (req, res) => {
    let usersToReturn = [];
    if (req.user.role === 'superadmin') {
        // Superadmin can see all users.
        usersToReturn = users;
    } else {
        // Non-superadmins only see users from their own company.
        usersToReturn = users.filter(u => u.companyId === req.user.companyId);
    }

    // Map users to include company name and exclude password
    const usersWithDetails = usersToReturn.map(u => {
        const company = companies.find(c => c.id === u.companyId);
        const { password, ...userWithoutPassword } = u;
        return { ...userWithoutPassword, companyName: company ? company.name : 'N/A' };
    });
    res.json(usersWithDetails);
});

app.post('/api/users', (req, res) => {
    const newUser = req.body;

    // Admins and Superadmins can create users. Middleware already blocks operators/readers.
    // Add specific logic to prevent admins from creating users with higher privileges.
    if (req.user.role === 'admin' && (newUser.role === 'admin' || newUser.role === 'superadmin')) {
        return res.status(403).json({ error: 'Forbidden: Admins cannot create other admins or superadmins.' });
    }

    if (!newUser.username || !newUser.name || !newUser.role) {
         return res.status(400).json({ error: 'Username, name, and role are required' });
    }

    let companyIdForNewUser;
    if (req.user.role === 'superadmin') {
        companyIdForNewUser = newUser.companyId;
        // If the new user is not a superadmin, they must be assigned to a company.
        if (newUser.role !== 'superadmin' && !companyIdForNewUser) {
            return res.status(400).json({ error: 'Superadmin must specify a companyId for non-superadmin users' });
        }
    } else {
        // Non-superadmins create users within their own company.
        companyIdForNewUser = req.user.companyId;
    }

    const userToSave = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        password: newUser.password, // In a real app, hash this
        role: newUser.role,
        companyId: companyIdForNewUser
    };

    users.push(userToSave);
    console.log(`Added new user:`, userToSave);
    const { password, ...userWithoutPassword } = userToSave;
    res.status(201).json(userWithoutPassword);
});

// Groups
app.get('/api/groups', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const groups = groupsByCompany[companyId] || [];
    res.json(groups);
});

app.post('/api/groups', (req, res) => {
    const companyId = getCompanyId(req);
     if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }
    if (!groupsByCompany[companyId]) {
        groupsByCompany[companyId] = [];
    }
    const newGroup = { id: Date.now(), name };
    groupsByCompany[companyId].push(newGroup);
    console.log(`Added new group to company ${companyId}:`, newGroup);
    res.status(201).json(newGroup);
});

// Departments
app.get('/api/departments', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const departments = departmentsByCompany[companyId] || [];
    res.json(departments);
});

app.post('/api/departments', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    if (!departmentsByCompany[companyId]) {
        departmentsByCompany[companyId] = [];
    }
    const newDepartment = { id: Date.now(), name };
    departmentsByCompany[companyId].push(newDepartment);
    console.log(`Added new department to company ${companyId}:`, newDepartment);
    res.status(201).json(newDepartment);
});


// Escalations
app.get('/api/escalations', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const escalations = escalationsByCompany[companyId] || [];
    res.json(escalations);
});

app.post('/api/escalations', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const ruleData = req.body;
    if (!ruleData.processId) {
        return res.status(400).json({ error: 'processId is required' });
    }

    if (!escalationsByCompany[companyId]) {
        escalationsByCompany[companyId] = [];
    }
    const escalations = escalationsByCompany[companyId];

    // Check if it's an update or a new rule
    const existingRuleIndex = ruleData.id ? escalations.findIndex(r => r.id === ruleData.id) : -1;

    if (existingRuleIndex > -1) {
        // Update existing rule
        escalations[existingRuleIndex] = { ...escalations[existingRuleIndex], ...ruleData };
        console.log(`Updated escalation rule for company ${companyId}:`, escalations[existingRuleIndex]);
        res.status(200).json(escalations[existingRuleIndex]);
    } else {
        // Create new rule
        const newRule = {
            ...ruleData,
            id: Date.now() // Assign a new unique ID
        };
        escalations.push(newRule);
        console.log(`Added new escalation rule to company ${companyId}:`, newRule);
        res.status(201).json(newRule);
    }
});

app.delete('/api/escalations/:id', (req, res) => {
    const { id } = req.params;
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
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
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const registrations = registrationsByCompany[companyId] || [];
    res.json(registrations);
});

app.post('/api/registrations', (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { processId, timestamp, values, phase } = req.body;
    if (!processId || !timestamp || !values) {
        return res.status(400).json({ error: 'processId, timestamp, and values are required' });
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
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // In a real app, you would generate a JWT token here.
        // For this example, we'll send back the user object (excluding password).
        const userToSend = { ...user };
        delete userToSend.password;
        res.json({ success: true, user: userToSend });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});