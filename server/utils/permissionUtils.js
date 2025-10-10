const db = require('../db');

const hasPermission = async (userRole, resource, action, roleId) => {
    // Superadmins and admins have all permissions implicitly.
    if (userRole === 'superadmin' || userRole === 'admin') {
        return true;
    }

    if (!roleId) {
        return false; // Cannot check permissions without a role context.
    }

    try {
        const query = `
            SELECT "${action}" FROM role_permissions
            WHERE role_id = $1 AND resource = $2
        `;
        const params = [roleId, resource];
        const { rows } = await db.query(query, params);

        if (rows.length === 0) {
            return false;
        }

        return rows[0][action] === true;
    } catch (error) {
        console.error('Error checking permissions:', error);
        return false;
    }
};

module.exports = {
    hasPermission,
};