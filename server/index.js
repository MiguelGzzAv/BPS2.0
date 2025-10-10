require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const seed = require('./seed');

// --- Route Imports ---
const companyRoutes = require('./routes/company.routes');
const processRoutes = require('./routes/process.routes');
const userRoutes = require('./routes/user.routes');
const groupRoutes = require('./routes/group.routes');
const escalationRoutes = require('./routes/escalation.routes');
const registrationRoutes = require('./routes/registration.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const permissionsRoutes = require('./routes/permissions.routes');
const rolePermissionsRoutes = require('./routes/rolePermissions.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const messagingRoutes = require('./routes/messaging.routes');
const databaseRoutes = require('./routes/database.routes');

const app = express();
const port = 3000;

// --- Core Middlewares ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Authentication & Authorization Middleware ---
const authAndAuthzMiddleware = async (req, res, next) => {
  const userId = req.headers['x-user-id'];

  // Handle the hardcoded superadmin case
  if (userId === '0') {
      req.user = {
          id: 0,
          username: 'superadmin',
          role: 'superadmin',
          is_superadmin: true
      };
      return next();
  }

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required. Please provide x-user-id header.' });
  }

  try {
    const query = `
        SELECT u.id, u.username, u.company_id AS "companyId", u.group_ids AS "groupIds", r.name AS role
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
    `;
    const { rows } = await db.query(query, [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid user.' });
    }

    req.user = user;

    if (user.role === 'superadmin') return next();

    let requestedCompanyId = req.query.companyId;
    if (req.method !== 'GET' && req.body && req.body.companyId) {
        requestedCompanyId = requestedCompanyId || req.body.companyId;
    }

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
  } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --- API Routes ---
app.use('/api/companies', authAndAuthzMiddleware, companyRoutes);
app.use('/api/processes', authAndAuthzMiddleware, processRoutes);
app.use('/api/users', authAndAuthzMiddleware, userRoutes);
app.use('/api/groups', authAndAuthzMiddleware, groupRoutes);
app.use('/api/escalations', authAndAuthzMiddleware, escalationRoutes);
app.use('/api/registrations', authAndAuthzMiddleware, registrationRoutes);
app.use('/api/dashboard', authAndAuthzMiddleware, dashboardRoutes);
app.use('/api/permissions', authAndAuthzMiddleware, permissionsRoutes);
app.use('/api/role-permissions', authAndAuthzMiddleware, rolePermissionsRoutes);
app.use('/api/maintenance', authAndAuthzMiddleware, maintenanceRoutes);
app.use('/api/messaging', authAndAuthzMiddleware, messagingRoutes);
app.use('/api/database', authAndAuthzMiddleware, databaseRoutes);

// --- Login Route (Unprotected) ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  // Hardcoded superadmin credentials as a fallback
  if (username === 'superadmin' && password === 'superadmin') {
    return res.json({
      success: true,
      user: {
        id: 0, // Static ID for superadmin
        username: 'superadmin',
        role: 'superadmin',
        is_superadmin: true,
      },
    });
  }

  try {
    const query = `
        SELECT u.id, u.username, u.name, u.company_id, c.name as "companyName", r.name as role, u.group_ids
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.username = $1 AND u.password = $2
    `;
    const userResult = await db.query(query, [username, password]);

    if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const userToSend = {
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            companyId: user.company_id,
            companyName: user.companyName,
            groupIds: user.group_ids || []
        };
        res.json({ success: true, user: userToSend });
    } else {
        res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
const startServer = async () => {
    if (process.env.NODE_ENV !== 'production') {
        console.log('Running in development mode. Seeding database...');
        await seed();
    }

    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
};

startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});