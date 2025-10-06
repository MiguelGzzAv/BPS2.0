const express = require('express');
const path = require('path');
const { users } = require('./data/database');

// --- Route Imports ---
const companyRoutes = require('./routes/company.routes');
const processRoutes = require('./routes/process.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const escalationRoutes = require('./routes/escalation.routes');
const registrationRoutes = require('./routes/registration.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();
const port = 3000;

// --- Core Middlewares ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Authentication & Authorization Middleware ---
const authAndAuthzMiddleware = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please provide x-user-id header.' });
  }

  const user = users.find(u => u.id === parseInt(userId));
  if (!user) {
    return res.status(401).json({ error: 'Invalid user.' });
  }

  req.user = user;

  if (user.role === 'superadmin') return next();

  const requestedCompanyId = req.query.companyId || req.body.companyId;
  if (requestedCompanyId && parseInt(requestedCompanyId) !== user.companyId) {
    return res.status(403).json({ error: "Forbidden: You cannot access another company's data." });
  }

  if (user.role === 'reader' && req.method !== 'GET') {
    return res.status(403).json({ error: 'Forbidden: Readers can only view data.' });
  }

  if (user.role === 'operator') {
    const allowedPostPaths = ['/registrations', '/escalations'];
    if (req.method !== 'GET' && !(req.method === 'POST' && allowedPostPaths.includes(req.path))) {
      return res.status(403).json({ error: 'Forbidden: Operators can only view data and create operational records.' });
    }
  }

  next();
};

// --- API Routes ---
app.use('/api/companies', authAndAuthzMiddleware, companyRoutes);
app.use('/api/processes', authAndAuthzMiddleware, processRoutes);
app.use('/api/users', authAndAuthzMiddleware, userRoutes);
app.use('/api/groups', authAndAuthzMiddleware, groupRoutes);
app.use('/api/escalations', authAndAuthzMiddleware, escalationRoutes);
app.use('/api/registrations', authAndAuthzMiddleware, registrationRoutes);
app.use('/api/dashboard', authAndAuthzMiddleware, dashboardRoutes);

// --- Login Route (Unprotected) ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const userToSend = { ...user };
    delete userToSend.password;
    res.json({ success: true, user: userToSend });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// --- Static Files & Frontend Entry Point ---
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error('--- UNHANDLED EXPRESS ERROR ---');
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});