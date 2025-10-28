const express = require('express');
const router = express.Router();
const configurationController = require('../controllers/configuration.controller');

// GET /api/configuration/env-example
router.get('/env-example', configurationController.getEnvExample);

module.exports = router;