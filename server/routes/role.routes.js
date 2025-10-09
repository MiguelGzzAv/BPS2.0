const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

// Note: The 'checkPermission' middleware will be applied in server/index.js
// to protect these routes.

// GET /api/roles - Get all roles for a company
router.get('/', roleController.getRoles);

// POST /api/roles - Create a new role
router.post('/', roleController.createRole);

// PUT /api/roles/:id - Update a role's name
router.put('/:id', roleController.updateRole);

// DELETE /api/roles/:id - Delete a role
router.delete('/:id', roleController.deleteRole);

module.exports = router;