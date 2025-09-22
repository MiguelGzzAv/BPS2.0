const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Mock data
const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];

app.use(express.static(path.join(__dirname, '../client')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies

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

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log(`Password reset requested for email: ${email}`);
    res.send('If an account with that email exists, a password reset link has been sent.');
});

// API endpoint to get the list of companies
app.get('/api/companies', (req, res) => {
    res.json(companies);
});

// API endpoint to get a single company by ID
app.get('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const company = companies.find(c => c.id === parseInt(id));
    if (company) {
        res.json(company);
    } else {
        res.status(404).json({ error: 'Company not found' });
    }
});

// API endpoint to add a new company
app.post('/api/companies', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    const newCompany = { id: newId, name };
    companies.push(newCompany);

    console.log('Added new company:', newCompany);
    res.status(201).json(newCompany);
});

// API endpoint to delete a company
app.delete('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const companyIndex = companies.findIndex(c => c.id === parseInt(id));

    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }

    companies.splice(companyIndex, 1);
    console.log(`Deleted company with id: ${id}`);
    res.status(204).send();
});

// API endpoint to update a company
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
    console.log('Updated company:', company);
    res.json(company);
});

// Mock data for processes
const processes = [
    {
        id: 'PRO7032',
        name: 'PROCESO NOCTURNO EJEMPLO',
        processType: 'Padre',
        fillType: 'Valores',
        startTime: '21:00',
        endTime: '23:00',
        frequency: 'Personalizado',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        values: [], // For the dynamic form schema
        subprocesses: [] // For the nested subprocesses
    }
];

// API endpoint to get the list of processes
app.get('/api/processes', (req, res) => {
    res.json(processes);
});

// API endpoint to add a new process
app.post('/api/processes', (req, res) => {
    const newProcess = req.body;
    if (!newProcess || !newProcess.id || !newProcess.name) {
        return res.status(400).json({ error: 'Process ID and name are required' });
    }
    processes.push(newProcess);
    console.log('Added new process:', newProcess);
    res.status(201).json(newProcess);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
