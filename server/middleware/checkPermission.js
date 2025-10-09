const db = require('../db');

// A mapping from HTTP method to the corresponding CRUD action in the database
const methodToAction = {
    'POST': 'create',
    'GET': 'read',
    'PUT': 'update',
    'PATCH': 'update', // Also maps to update
    'DELETE': 'delete'
};

/**
 * Middleware factory to generate a permission checker.
 * @param {string} resource - The name of the resource (e.g., 'processes', 'users').
 * @returns {function} An Express middleware function.
 */
const checkPermission = (resource) => {
    return async (req, res, next) => {
        // Superadmins have unrestricted access and bypass this check
        if (req.user && req.user.is_superadmin) {
            return next();
        }

        const roleId = req.user ? req.user.role_id : null;
        if (!roleId) {
            return res.status(403).json({ error: 'Forbidden: You do not have an assigned role.' });
        }

        const action = methodToAction[req.method];
        if (!action) {
            // If the method is not in our map, it's likely something like HEAD or OPTIONS.
            // We'll deny by default to be safe.
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            const query = `
                SELECT "create", "read", "update", "delete"
                FROM role_permissions
                WHERE role_id = $1 AND resource = $2
            `;
            const { rows } = await db.query(query, [roleId, resource]);

            if (rows.length === 0) {
                // No permissions defined for this role and resource
                return res.status(403).json({ error: `Forbidden: No permissions set for resource '${resource}'.` });
            }

            const permissions = rows[0];
            if (!permissions[action]) {
                // The specific action is denied for this role
                return res.status(403).json({ error: `Forbidden: Your role does not have '${action}' permission for this resource.` });
            }

            // If we reach here, the user has permission
            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Internal Server Error during permission check.' });
        }
    };
};

module.exports = checkPermission;