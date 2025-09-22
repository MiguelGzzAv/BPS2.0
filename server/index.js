const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Set up the database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.serialize(() => {
            // Enable foreign key constraints
            db.run("PRAGMA foreign_keys = ON;");
            // Create companies table if it doesn't exist
            db.run(`CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE
            )`);
            // Create departments table if it doesn't exist
            db.run(`CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                company_id INTEGER NOT NULL,
                FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
            )`);
        });
    }
});

app.use(express.static(path.join(__dirname, '../client')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON bodies

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

app.get('/company-dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../client', 'company-dashboard.html'));
});

app.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log(`Password reset requested for email: ${email}`);
    res.send('If an account with that email exists, a password reset link has been sent.');
});

// === API Endpoints for Companies ===

// GET all companies
app.get('/api/companies', (req, res) => {
    db.all("SELECT * FROM companies", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// GET a single company by id
app.get('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM companies WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ "error": "Company not found" });
        }
    });
});

// POST a new company
app.post('/api/companies', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    const sql = "INSERT INTO companies (name) VALUES (?)";
    db.run(sql, [name], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, name: name });
    });
});

// DELETE a company
app.delete('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM companies WHERE id = ?";
    db.run(sql, id, function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.status(204).send();
    });
});

// PUT (update) a company
app.put('/api/companies/:id', (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }

    const sql = "UPDATE companies SET name = ? WHERE id = ?";
    db.run(sql, [name, id], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Company not found' });
        }
        res.json({ id: id, name: name });
    });
});

// === API Endpoints for Departments ===

// GET all departments for a specific company
app.get('/api/companies/:companyId/departments', (req, res) => {
    const { companyId } = req.params;
    const sql = "SELECT * FROM departments WHERE company_id = ?";
    db.all(sql, [companyId], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// POST a new department for a specific company
app.post('/api/companies/:companyId/departments', (req, res) => {
    const { companyId } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }

    const sql = "INSERT INTO departments (name, company_id) VALUES (?, ?)";
    db.run(sql, [name, companyId], function(err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, name: name, company_id: companyId });
    });
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
