const { permissionsByCompany } = require('../data/database');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

// Get all permissions for a given company
const getPermissions = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided.' });
    }

    const permissions = permissionsByCompany[companyId] || {};
    res.json(permissions);
};

// Update the permissions for a given company
const updatePermissions = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided.' });
    }

    const newPermissions = req.body;
    if (typeof newPermissions !== 'object' || newPermissions === null) {
        return res.status(400).json({ error: 'Invalid permissions data format.' });
    }

    permissionsByCompany[companyId] = newPermissions;
    console.log(`Updated permissions for company ${companyId}:`, newPermissions);
    res.status(200).json({ message: 'Permissions updated successfully.' });
};

module.exports = {
    getPermissions,
    updatePermissions,
};