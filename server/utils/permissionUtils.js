const { rolePermissionsByCompany } = require('../data/database');

/**
 * Checks if a user's role has permission to perform a specific action on a resource.
 *
 * @param {string} role - The role of the user (e.g., 'admin', 'operator').
 * @param {string} resource - The resource being accessed (e.g., 'users', 'processes').
 * @param {string} action - The action being performed (e.g., 'create', 'read', 'update', 'delete').
 * @param {string} companyId - The ID of the company to check permissions for.
 * @returns {boolean} - True if the user has permission, false otherwise.
 */
const hasPermission = (role, resource, action, companyId) => {
    // Superadmins have all permissions implicitly.
    if (role === 'superadmin') {
        return true;
    }

    const companyPermissions = rolePermissionsByCompany[companyId];
    if (!companyPermissions) {
        // If no specific permissions are set for the company, deny access.
        return false;
    }

    const rolePerms = companyPermissions[role];
    if (!rolePerms) {
        // If no permissions are set for the role, deny access.
        return false;
    }

    const resourcePerms = rolePerms[resource];
    if (!resourcePerms) {
        // If no permissions are set for the resource under this role, deny access.
        return false;
    }

    // Check if the specific action is explicitly set to true.
    return resourcePerms[action] === true;
};

module.exports = {
    hasPermission,
};