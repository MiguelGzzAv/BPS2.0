const { maintenanceStatus } = require('../data/database');

// Controller to get the current maintenance status
const getMaintenanceStatus = (req, res) => {
    res.status(200).json(maintenanceStatus);
};

// Controller to update the maintenance status
const updateMaintenanceStatus = (req, res) => {
    // This action should be restricted to superadmins only.
    // The main auth middleware in index.js handles the basic user check,
    // but we add a specific role check here for extra security.
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
    }

    const newStatus = req.body;

    // Basic validation to ensure we're getting an object
    if (typeof newStatus !== 'object' || newStatus === null) {
        return res.status(400).json({ error: 'Invalid payload. Expected an object.' });
    }

    // Update the status in our mock database
    let updated = false;
    for (const page in newStatus) {
        if (Object.prototype.hasOwnProperty.call(maintenanceStatus, page)) {
            maintenanceStatus[page] = !!newStatus[page]; // Coerce to boolean
            updated = true;
        }
    }

    if (!updated) {
        return res.status(400).json({ error: 'Invalid payload. No valid page keys found.' });
    }

    res.status(200).json({ message: 'Maintenance status updated successfully.', status: maintenanceStatus });
};

module.exports = {
    getMaintenanceStatus,
    updateMaintenanceStatus,
};