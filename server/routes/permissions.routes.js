const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/permissions
// Fetches all page permissions for a given company, structured by group ID.
router.get('/', async (req, res) => {
    try {
        const companyId = req.query.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId is required.' });
        }

        // This endpoint is only for fetching data, so we can restrict access if needed.
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            // For now, let's allow all authenticated users of the company to fetch this.
            // In a more secure system, this might be restricted.
        }

        const { rows } = await db.query('SELECT group_id, page_id FROM permissions WHERE group_id IN (SELECT id FROM groups WHERE company_id = $1)', [companyId]);

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
        console.error('Error fetching page permissions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;