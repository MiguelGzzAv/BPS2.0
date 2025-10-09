const db = require('../db');

const methodToAction = {
    'POST': 'create',
    'GET': 'read',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
};

const checkPermission = (resource) => {
    return async (req, res, next) => {
        if (req.user && req.user.is_superadmin) {
            return next();
        }

        const roleId = req.user ? req.user.role_id : null;
        if (!roleId) {
            return res.status(403).json({ error: 'Forbidden: You do not have an assigned role.' });
        }

        const action = methodToAction[req.method];
        if (!action) {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        try {
            const query = `
                SELECT "create", "read", "update", "delete"
                FROM role_permissions
                WHERE role_id = $1 AND resource = $2
            `;
            const { rows } = await db.query(query, [roleId, resource]);

            if (rows.length === 0 || !rows[0][action]) {
                return res.status(403).json({ error: `Forbidden: Your role does not have '${action}' permission for this resource.` });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({ error: 'Internal Server Error during permission check.' });
        }
    };
};

module.exports = checkPermission;