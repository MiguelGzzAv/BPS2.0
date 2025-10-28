const express = require('express');
const router = express.Router();
const { getPermissions, updatePermissions } = require('../controllers/permissions.controller');

// Middleware to ensure only admins can manage permissions
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to manage roles.' });
    }
    next();
};

router.get('/', getPermissions);
router.post('/', isAdmin, updatePermissions);

module.exports = router;