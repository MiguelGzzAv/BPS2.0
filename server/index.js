require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./db');
const seed = require('./seed');

// --- Middleware Imports ---
const authAndAuthzMiddleware = require('./middleware/auth');
const checkPermission = require('./middleware/checkPermission');

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
const roleRoutes = require('./routes/role.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const messagingRoutes = require('./routes/messaging.routes');
const databaseRoutes = require('./routes/database.routes');
const configurationRoutes = require('./routes/configuration.routes');

const app = express();
const port = 3000;

// --- Core Middlewares ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- API Routes ---
// The `authAndAuthzMiddleware` is applied to all protected routes.
// The `checkPermission` middleware is then applied to specific resource routes to enforce CRUD permissions.

// Maintenance route is handled separately to allow public GET
app.use('/api/maintenance', maintenanceRoutes);

// Unprotected or lightly protected routes
app.use('/api/companies', authAndAuthzMiddleware, companyRoutes);
app.use('/api/dashboard', authAndAuthzMiddleware, dashboardRoutes);

// Granular permission-protected routes
app.use('/api/processes', authAndAuthzMiddleware, checkPermission('processes'), processRoutes);
app.use('/api/users', authAndAuthzMiddleware, checkPermission('users'), userRoutes);
app.use('/api/groups', authAndAuthzMiddleware, checkPermission('groups'), groupRoutes);
app.use('/api/escalations', authAndAuthzMiddleware, checkPermission('escalations'), escalationRoutes);
app.use('/api/registrations', authAndAuthzMiddleware, checkPermission('registrations'), registrationRoutes);
app.use('/api/permissions', authAndAuthzMiddleware, checkPermission('permissions'), permissionsRoutes);
app.use('/api/role-permissions', authAndAuthzMiddleware, checkPermission('role-permissions'), rolePermissionsRoutes);
app.use('/api/roles', authAndAuthzMiddleware, checkPermission('roles'), roleRoutes);
app.use('/api/messaging', authAndAuthzMiddleware, checkPermission('messaging'), messagingRoutes);
app.use('/api/database', authAndAuthzMiddleware, checkPermission('database'), databaseRoutes);
app.use('/api/configuration', authAndAuthzMiddleware, checkPermission('configuration'), configurationRoutes);


// --- Login Route (Unprotected) ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);

    if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        const userToSend = { ...user };
        delete userToSend.password;

        // Fetch role name and check for superadmin status
        if (user.role_id) {
            const roleResult = await db.query('SELECT name, is_system_role FROM roles WHERE id = $1', [user.role_id]);
            if (roleResult.rows.length > 0) {
                const role = roleResult.rows[0];
                userToSend.role_name = role.name;
                userToSend.is_superadmin = (role.name === 'superadmin' && role.is_system_role);
            }
        }

        if (user.company_id) {
            const companyResult = await db.query('SELECT name FROM companies WHERE id = $1', [user.company_id]);
            if (companyResult.rows.length > 0) {
                userToSend.companyName = companyResult.rows[0].name;
            }
            userToSend.companyId = user.company_id;
            delete userToSend.company_id;
            userToSend.groupIds = user.group_ids;
            delete userToSend.group_ids;
        }

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
        const seed = require('./seed');
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