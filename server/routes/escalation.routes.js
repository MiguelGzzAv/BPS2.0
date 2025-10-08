const express = require('express');
const router = express.Router();
const {
    getEscalationRules,
    createOrUpdateEscalationRule,
    deleteEscalationRule
} = require('../controllers/escalation.controller');

// Define routes for escalation rules
router.get('/', getEscalationRules);
router.post('/', createOrUpdateEscalationRule); // This route handles both create and update
router.delete('/:id', deleteEscalationRule);

module.exports = router;