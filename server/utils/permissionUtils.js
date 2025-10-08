const db = require('../db');

/**
 * Checks if a user's role has permission to perform a specific action on a resource.
 *
 * @param {string} role - The role of the user (e.g., 'admin', 'operator').
 * @param {string} resource - The resource being accessed (e.g., 'users', 'processes').
 * @param {string} action - The action being performed (e.g., 'create', 'read', 'update', 'delete').
 * @param {string|number} companyId - The ID of the company to check permissions for.
 * @returns {Promise<boolean>} - True if the user has permission, false otherwise.
 */
const hasPermission = async (role, resource, action, companyId) => {
    // Superadmins have all permissions implicitly.
    if (role === 'superadmin') {
        return true;
    }

    if (!companyId) {
        return false; // Cannot check permissions without a company context.
    }

    try {
        const query = `
            SELECT "${action}" FROM role_permissions
            WHERE company_id = $1 AND role = $2 AND resource = $3
        `;
        const params = [companyId, role, resource];
        const { rows } = await db.query(query, params);

        if (rows.length === 0) {
            // No specific permission rule found, so deny access.
            return false;
        }

        // Return the boolean value of the requested action column (e.g., "create", "read").
        return rows[0][action] === true;
    } catch (error) {
        console.error('Error checking permissions:', error);
        return false; // Deny permission on error.
    }
};

module.exports = {
    hasPermission,
};