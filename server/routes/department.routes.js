const express = require('express');
const router = express.Router();
const {
    getDepartments,
    createDepartment
} = require('../controllers/department.controller');

// Define routes for departments
router.get('/', getDepartments);
router.post('/', createDepartment);

module.exports = router;