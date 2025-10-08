const db = require('../db');
const { hasPermission } = require('../utils/permissionUtils');

const getGroups = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? (req.query.companyId || req.user.companyId) : req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        if (!await hasPermission(req.user.role, 'groups', 'read', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to view groups.' });
        }

        const { rows } = await db.query('SELECT * FROM groups WHERE company_id = $1 ORDER BY name', [companyId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createGroup = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        const { name } = req.body;

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided to create a group.' });
        }
        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        if (!await hasPermission(req.user.role, 'groups', 'create', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to create groups.' });
        }

        const { rows } = await db.query(
            'INSERT INTO groups (company_id, name) VALUES ($1, $2) RETURNING *',
            [companyId, name]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateGroup = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        const groupId = parseInt(req.params.id);
        const { name } = req.body;

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided to update a group.' });
        }
        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        if (!await hasPermission(req.user.role, 'groups', 'update', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to update groups.' });
        }

        const { rows } = await db.query(
            'UPDATE groups SET name = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
            [name, groupId, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Group not found in the specified company' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteGroup = async (req, res) => {
    try {
        // Note: For DELETE, companyId might be in req.body or req.query for superadmin
        const companyId = req.user.role === 'superadmin' ? (req.body.companyId || req.query.companyId) : req.user.companyId;
        const groupId = parseInt(req.params.id);

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided to delete a group.' });
        }

        if (!await hasPermission(req.user.role, 'groups', 'delete', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete groups.' });
        }

        const result = await db.query('DELETE FROM groups WHERE id = $1 AND company_id = $2', [groupId, companyId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Group not found in the specified company' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting group:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup
};