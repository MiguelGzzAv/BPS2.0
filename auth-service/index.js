const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret'; // It is recommended to use an environment variable for the secret

app.use(express.json());

// Mock user data
const users = [
    { id: 1, username: 'admin', password: '12345' }
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.post('/validate', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).send('Token is required');
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).send('Invalid token');
        }
        res.json({ valid: true, user });
    });
});

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
