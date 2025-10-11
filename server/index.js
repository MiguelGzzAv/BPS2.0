const express = require('express');
const path = require('path');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

// Mock data
const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];

app.use(express.static(path.join(__dirname, 'client')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(cookieParser());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const response = await axios.post('http://auth-service:3001/login', { username, password });
        const { token } = response.data;
        res.cookie('token', token, { httpOnly: true });
        res.redirect('/dashboard');
    } catch (error) {
        res.status(401).send('Invalid username or password');
    }
});

const verifyToken = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.redirect('/');
    }
    try {
        await axios.post('http://auth-service:3001/validate', { token });
        next();
    } catch (error) {
        return res.redirect('/');
    }
};

app.get('/dashboard', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'dashboard.html'));
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
