const db = require('../db');

const getRolePermissions = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const query = `
            SELECT r.id as "roleId", r.name as "roleName", rp.resource, rp.create, rp.read, rp.update, rp.delete
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            WHERE r.company_id = $1
        `;
        const { rows } = await db.query(query, [companyId]);

        // Aggregate flat results into the nested object structure expected by the frontend
        const permissions = rows.reduce((acc, row) => {
            const { roleName, resource, create, read, update, "delete": del } = row;
            if (!acc[roleName]) {
                acc[roleName] = {};
            }
            if (resource) { // Handle roles that might not have any permissions yet
                if (!acc[roleName][resource]) {
                    acc[roleName][resource] = {};
                }
                acc[roleName][resource] = { create, read, update, delete: del };
            }
            return acc;
        }, {});

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
        const rolesResult = await client.query('SELECT id, name FROM roles WHERE company_id = $1', [companyId]);
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

            // Insert the new permissions for this role
            for (const resource in newPermissions[roleName]) {
                const perms = newPermissions[roleName][resource];
                await client.query(
                    'INSERT INTO role_permissions (role_id, resource, "create", "read", "update", "delete") VALUES ($1, $2, $3, $4, $5, $6)',
                    [roleId, resource, !!perms.create, !!perms.read, !!perms.update, !!perms.delete]
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