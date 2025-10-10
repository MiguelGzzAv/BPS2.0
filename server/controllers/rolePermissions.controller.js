const db = require('../db');

const getRolePermissions = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const { rows } = await db.query('SELECT role, resource, "create", "read", "update", "delete" FROM role_permissions WHERE company_id = $1', [companyId]);

        // Aggregate flat results into the nested object structure expected by the frontend
        const permissions = rows.reduce((acc, row) => {
            const { role, resource, create, read, update, "delete": del } = row;
            if (!acc[role]) {
                acc[role] = {};
            }
            if (!acc[role][resource]) {
                acc[role][resource] = {};
            }
            acc[role][resource] = { create, read, update, delete: del };
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

        const newPermissions = req.body.permissions; // Assuming permissions are nested
        if (typeof newPermissions !== 'object' || newPermissions === null) {
            return res.status(400).json({ error: 'Invalid permissions data format.' });
        }

        await client.query('BEGIN');

        // First, delete all existing role permissions for this company.
        await client.query('DELETE FROM role_permissions WHERE company_id = $1', [companyId]);

        // Then, insert the new permissions
        for (const role in newPermissions) {
            for (const resource in newPermissions[role]) {
                const perms = newPermissions[role][resource];
                await client.query(
                    'INSERT INTO role_permissions (company_id, role, resource, "create", "read", "update", "delete") VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [companyId, role, resource, !!perms.create, !!perms.read, !!perms.update, !!perms.delete]
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