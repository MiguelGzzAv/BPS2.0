const express = require('express');
const router = express.Router();
const { getLatestMessage, createMessage } = require('../controllers/messaging.controller');

// GET /api/messaging/latest - Fetches the most recent global message
router.get('/latest', getLatestMessage);

// POST /api/messaging - Creates a new global message (superadmin only)
router.post('/', createMessage);

module.exports = router;