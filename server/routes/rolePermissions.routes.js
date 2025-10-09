const express = require('express');
const router = express.Router();
const { getRolePermissions, updateRolePermissions } = require('../controllers/rolePermissions.controller');

// Middleware to ensure only admins can manage permissions
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to manage role permissions.' });
    }
    next();
};

router.get('/', isAdmin, getRolePermissions);
router.post('/', isAdmin, updateRolePermissions);

module.exports = router;