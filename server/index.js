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
    res.json(processes);
});

app.post('/api/processes', (req, res) => {
    const { companyId, processData } = req.body;
    if (!companyId || !processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'companyId and process data (including id and name) are required' });
    }
    if (!processesByCompany[companyId]) {
        processesByCompany[companyId] = [];
    }
    processesByCompany[companyId].push(processData);
    console.log(`Added new process to company ${companyId}:`, processData);
    res.status(201).json(processData);
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
