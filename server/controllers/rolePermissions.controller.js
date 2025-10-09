const db = require('../db');

const getRolePermissions = async (req, res) => {
    try {
        // Superadmin can specify a companyId, otherwise it's taken from the user's token
        const companyId = req.user.is_superadmin ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        // We join with the roles table to filter by company_id and get role names
        const query = `
            SELECT
                rp.role_id,
                r.name AS role_name,
                rp.resource,
                rp.create,
                rp.read,
                rp.update,
                rp.delete
            FROM
                role_permissions rp
            JOIN
                roles r ON rp.role_id = r.id
            WHERE
                r.company_id = $1
        `;

        const { rows } = await db.query(query, [companyId]);

        // Aggregate flat results into the nested object structure expected by the frontend
        // The structure will be { role_id: { resource: { permissions } } }
        const permissions = rows.reduce((acc, row) => {
            const { role_id, resource, create, read, update, "delete": del } = row;
            if (!acc[role_id]) {
                acc[role_id] = {};
            }
            acc[role_id][resource] = { create, read, update, delete: del };
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
        const companyId = req.user.is_superadmin ? req.body.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        // The frontend will now send permissions keyed by role_id
        const permissionsByRoleId = req.body.permissions;
        if (typeof permissionsByRoleId !== 'object' || permissionsByRoleId === null) {
            return res.status(400).json({ error: 'Invalid permissions data format.' });
        }

        await client.query('BEGIN');

        // First, delete all existing role permissions for the roles of this company.
        await client.query(
            'DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE company_id = $1)',
            [companyId]
        );

        // Then, insert the new permissions
        for (const roleId in permissionsByRoleId) {
            const roleCheck = await client.query('SELECT id FROM roles WHERE id = $1 AND company_id = $2', [roleId, companyId]);
            if (roleCheck.rows.length === 0) {
                console.warn(`Attempted to update permissions for role ${roleId} which does not belong to company ${companyId}. Skipping.`);
                continue;
            }

            for (const resource in permissionsByRoleId[roleId]) {
                const perms = permissionsByRoleId[roleId][resource];
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