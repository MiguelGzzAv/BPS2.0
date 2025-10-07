const express = require('express');
const router = express.Router();
const { getMaintenanceStatus, updateMaintenanceStatus } = require('../controllers/maintenance.controller');

// GET /api/maintenance - Fetches the current maintenance status for all pages
router.get('/', getMaintenanceStatus);

// POST /api/maintenance - Updates the maintenance status
// The middleware in server/index.js will protect this route
router.post('/', updateMaintenanceStatus);

module.exports = router;