const db = require('../db');

const getPermissions = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const query = `
            SELECT p.group_id, p.page_id
            FROM permissions p
            JOIN groups g ON p.group_id = g.id
            WHERE g.company_id = $1
        `;
        const { rows } = await db.query(query, [companyId]);

        // Aggregate flat results into the nested object structure expected by the frontend
        const permissions = rows.reduce((acc, row) => {
            const { group_id, page_id } = row;
            if (!acc[group_id]) {
                acc[group_id] = [];
            }
            acc[group_id].push(page_id);
            return acc;
        }, {});

        res.json(permissions);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updatePermissions = async (req, res) => {
    const client = await db.getClient();
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided.' });
        }

        const newPermissions = req.body.permissions; // Assuming permissions are nested under a key
        if (typeof newPermissions !== 'object' || newPermissions === null) {
            return res.status(400).json({ error: 'Invalid permissions data format.' });
        }

        await client.query('BEGIN');

        // First, delete all existing permissions for the groups belonging to this company.
        const deleteQuery = `
            DELETE FROM permissions p
            USING groups g
            WHERE p.group_id = g.id AND g.company_id = $1
        `;
        await client.query(deleteQuery, [companyId]);

        // Then, insert the new permissions
        for (const groupId in newPermissions) {
            const pageIds = newPermissions[groupId];
            if (Array.isArray(pageIds)) {
                for (const pageId of pageIds) {
                    await client.query(
                        'INSERT INTO permissions (group_id, page_id) VALUES ($1, $2)',
                        [parseInt(groupId), pageId]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.status(200).json({ message: 'Permissions updated successfully.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getPermissions,
    updatePermissions,
};