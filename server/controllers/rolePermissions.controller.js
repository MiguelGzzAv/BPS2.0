const { rolePermissionsByCompany } = require('../data/database');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

// Get all role permissions for a given company
const getRolePermissions = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided.' });
    }

    const permissions = rolePermissionsByCompany[companyId] || {};
    res.json(permissions);
};

// Update the role permissions for a given company
const updateRolePermissions = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided.' });
    }

    const newPermissions = req.body;
    if (typeof newPermissions !== 'object' || newPermissions === null) {
        return res.status(400).json({ error: 'Invalid permissions data format.' });
    }

    rolePermissionsByCompany[companyId] = newPermissions;
    console.log(`Updated role permissions for company ${companyId}:`, newPermissions);
    res.status(200).json({ message: 'Role permissions updated successfully.' });
};

module.exports = {
    getRolePermissions,
    updateRolePermissions,
};