const db = require('../db');

// Get all roles for a company
const getRoles = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'Company ID is required.' });
        }

        const { rows } = await db.query('SELECT id, name, is_system_role FROM roles WHERE company_id = $1 ORDER BY name', [companyId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Create a new role
const createRole = async (req, res) => {
    try {
        const { name } = req.body;
        const companyId = req.user.companyId;

        if (!name) {
            return res.status(400).json({ error: 'Role name is required.' });
        }

        const { rows } = await db.query(
            'INSERT INTO roles (company_id, name) VALUES ($1, $2) RETURNING id, name, is_system_role',
            [companyId, name]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        if (error.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: 'A role with this name already exists for the company.' });
        }
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update a role
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const companyId = req.user.companyId;

        if (!name) {
            return res.status(400).json({ error: 'Role name is required.' });
        }

        const { rows } = await db.query(
            'UPDATE roles SET name = $1 WHERE id = $2 AND company_id = $3 AND is_system_role = false RETURNING id, name, is_system_role',
            [name, id, companyId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Role not found, it is a system role, or you do not have permission to update it.' });
        }

        res.json(rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'A role with this name already exists for the company.' });
        }
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Delete a role
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;

        // Before deleting, check if any users are assigned to this role
        const userCheck = await db.query('SELECT COUNT(*) FROM users WHERE role_id = $1 AND company_id = $2', [id, companyId]);
        if (parseInt(userCheck.rows[0].count, 10) > 0) {
            return res.status(400).json({ error: 'Cannot delete role as it is currently assigned to one or more users.' });
        }

        const { rowCount } = await db.query(
            'DELETE FROM roles WHERE id = $1 AND company_id = $2 AND is_system_role = false',
            [id, companyId]
        );

        if (rowCount === 0) {
            return res.status(404).json({ error: 'Role not found, it is a system role, or you do not have permission to delete it.' });
        }

        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
};