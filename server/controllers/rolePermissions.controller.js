const db = require('../db');

const getRolePermissions = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.company_id;
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

        const permissions = rows.reduce((acc, row) => {
            const { roleName, resource, create, read, update, "delete": del, pages } = row;
            if (!acc[roleName]) {
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
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.company_id;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const newPermissions = req.body.permissions;
        if (typeof newPermissions !== 'object' || newPermissions === null) {
            return res.status(400).json({ error: 'Invalid permissions data format.' });
        }

        await client.query('BEGIN');

        const rolesResult = await client.query('SELECT id, name FROM roles WHERE company_id = $1 OR is_system_role = true', [companyId]);
        const roleNameToIdMap = new Map(rolesResult.rows.map(r => [r.name, r.id]));

        for (const roleName in newPermissions) {
            const roleId = roleNameToIdMap.get(roleName);
            if (!roleId) {
                console.warn(`Skipping permissions for unknown role "${roleName}"`);
                continue;
            }

            await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

            const rolePerms = newPermissions[roleName];
            const pages = rolePerms.pages || [];
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