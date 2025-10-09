const express = require('express');
const router = express.Router();
const { getMaintenanceStatus, updateMaintenanceStatus } = require('../controllers/maintenance.controller');
const authAndAuthzMiddleware = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');

// GET /api/maintenance - Publicly accessible to fetch maintenance status
router.get('/', getMaintenanceStatus);

// POST /api/maintenance - Protected route to update maintenance status
// Requires authentication and specific permission to 'update' the 'maintenance' resource
router.post('/', authAndAuthzMiddleware, checkPermission('maintenance'), updateMaintenanceStatus);

module.exports = router;