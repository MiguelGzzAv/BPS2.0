const express = require('express');
const router = express.Router();
const {
    getEscalations,
    createOrUpdateEscalation,
    deleteEscalation
} = require('../controllers/escalation.controller');

// Define routes for escalations
router.get('/', getEscalations);
router.post('/', createOrUpdateEscalation);
router.delete('/:id', deleteEscalation);

module.exports = router;