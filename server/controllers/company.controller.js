const db = require('../db');

const getCompanies = async (req, res) => {
    try {
        if (req.user.role === 'superadmin') {
            const { rows } = await db.query('SELECT * FROM companies ORDER BY name');
            res.json(rows);
        } else {
            const { rows } = await db.query('SELECT * FROM companies WHERE id = $1', [req.user.companyId]);
            res.json(rows);
        }
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role !== 'superadmin' && req.user.companyId !== parseInt(id)) {
            return res.status(403).json({ error: 'Forbidden: You can only view your own company.' });
        }
        const { rows } = await db.query('SELECT * FROM companies WHERE id = $1', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error(`Error fetching company ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createCompany = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Forbidden: Only superadmins can create companies.' });
        }
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        const { rows } = await db.query('INSERT INTO companies (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateCompany = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Forbidden: Only superadmins can update companies.' });
        }
        const { id } = req.params;
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Company name is required' });
        }
        const { rows } = await db.query('UPDATE companies SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error(`Error updating company ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteCompany = async (req, res) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Forbidden: Only superadmins can delete companies.' });
        }
        const { id } = req.params;
        const result = await db.query('DELETE FROM companies WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Company not found' });
        }
    } catch (error) {
        console.error(`Error deleting company ${req.params.id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany
};