const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/audit.controller');

// GET /api/audit-logs - Fetches all audit log entries
router.get('/', getAuditLogs);

module.exports = router;