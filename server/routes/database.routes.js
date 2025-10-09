const express = require('express');
const router = express.Router();
const databaseController = require('../controllers/database.controller');

// GET /api/database/status
router.get('/status', databaseController.getDatabaseStatus);

module.exports = router;