const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');

// All routes in this file are expected to be protected and have access to req.user
router.get('/', roleController.getRoles);
router.post('/', roleController.createRole);
router.put('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

module.exports = router;