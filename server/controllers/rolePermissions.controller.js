const db = require('../db');

const getRolePermissions = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const query = `
            SELECT r.id as "roleId", r.name as "roleName", rp.resource, rp.create, rp.read, rp.update, rp.delete, rp.pages
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            WHERE r.company_id = $1 OR r.is_system_role = true
        `;
        const { rows } = await db.query(query, [companyId]);

        // Aggregate flat results into the nested object structure expected by the frontend
        const permissions = rows.reduce((acc, row) => {
            const { roleName, resource, create, read, update, "delete": del, pages } = row;
            if (!acc[roleName]) {
                // Initialize with pages set and an empty object for resources
                acc[roleName] = { pages: new Set() };
            }
            if (resource) {
                acc[roleName][resource] = { create, read, update, delete: del };
            }
            if (pages) {
                pages.forEach(page => acc[roleName].pages.add(page));
            }
            return acc;
        }, {});

        // Convert sets to arrays for JSON serialization
        Object.keys(permissions).forEach(roleName => {
            permissions[roleName].pages = Array.from(permissions[roleName].pages);
        });

        res.json(permissions);
    } catch (error) {
        console.error('Error fetching role permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateRolePermissions = async (req, res) => {
    const client = await db.getClient();
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const newPermissions = req.body.permissions; // Permissions are keyed by role name
        if (typeof newPermissions !== 'object' || newPermissions === null) {
            return res.status(400).json({ error: 'Invalid permissions data format.' });
        }

        await client.query('BEGIN');

        // Get a map of role names to role IDs for the current company
        const rolesResult = await client.query('SELECT id, name FROM roles WHERE company_id = $1 OR is_system_role = true', [companyId]);
        const roleNameToIdMap = new Map(rolesResult.rows.map(r => [r.name, r.id]));

        // Iterate through the permissions sent from the client
        for (const roleName in newPermissions) {
            const roleId = roleNameToIdMap.get(roleName);
            if (!roleId) {
                console.warn(`Skipping permissions for unknown role "${roleName}" in company ${companyId}`);
                continue;
            }

            // Clear existing permissions for this specific role
            await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

            const rolePerms = newPermissions[roleName];
            const pages = rolePerms.pages || [];

            // Insert the new permissions for this role for each resource
            // Note: This creates a separate row for each resource, which is correct.
            // The page permissions will be duplicated across these rows, which is a design choice for simplicity here.
            const resources = Object.keys(rolePerms).filter(k => k !== 'pages');
            if (resources.length > 0) {
                 for (const resource of resources) {
                    const perms = rolePerms[resource];
                    await client.query(
                        'INSERT INTO role_permissions (role_id, resource, "create", "read", "update", "delete", pages) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                        [roleId, resource, !!perms.create, !!perms.read, !!perms.update, !!perms.delete, pages]
                    );
                }
            } else {
                 // If a role has no resource permissions, save its page permissions in a single row with a placeholder resource
                 await client.query(
                    'INSERT INTO role_permissions (role_id, resource, pages) VALUES ($1, $2, $3)',
                    [roleId, 'default', pages]
                );
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Role permissions updated successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating role permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getRolePermissions,
    updateRolePermissions,
};