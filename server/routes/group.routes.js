const express = require('express');
const router = express.Router();
const {
    getGroups,
    createGroup
} = require('../controllers/group.controller');

// Define routes for groups
router.get('/', getGroups);
router.post('/', createGroup);

module.exports = router;