const express = require('express');
const router = express.Router();
const {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
} = require('../controllers/department.controller');

// Define routes for departments
router.get('/', getDepartments);
router.post('/', createDepartment);
router.put('/:id', updateDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;