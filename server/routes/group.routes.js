const express = require('express');
const router = express.Router();
const {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup
} = require('../controllers/group.controller');

// Define routes for groups
router.get('/', getGroups);
router.post('/', createGroup);
router.put('/:id', updateGroup);
router.delete('/:id', deleteGroup);

module.exports = router;