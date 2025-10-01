const express = require('express');
const router = express.Router();
const {
    getRegistrations,
    createRegistration
} = require('../controllers/registration.controller');

// Define routes for registrations
router.get('/', getRegistrations);
router.post('/', createRegistration);

module.exports = router;