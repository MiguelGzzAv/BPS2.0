const express = require('express');
const router = express.Router();
const {
    getSummary,
    getAffectedProcesses,
    getProcessesByStatus
} = require('../controllers/dashboard.controller');

// Define routes for dashboard-specific data
router.get('/summary', getSummary);
router.get('/affected-processes', getAffectedProcesses);
router.get('/processes-by-status/:status', getProcessesByStatus);

module.exports = router;