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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'login.html'));
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '12345') {
        res.redirect('/dashboard');
    } else {
        res.send('Invalid username or password');
    }
});

app.get('/dashboard', (req, res) => {
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

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
