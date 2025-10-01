const express = require('express');
const router = express.Router();
const {
    getSummary,
    getAffectedProcesses
} = require('../controllers/dashboard.controller');

// Define routes for dashboard-specific data
router.get('/summary', getSummary);
router.get('/affected-processes', getAffectedProcesses);

module.exports = router;