const db = require('../db');

const getRegistrations = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        const { rows } = await db.query(
            'SELECT process_id AS "processId", "timestamp", "values", phase FROM registrations WHERE company_id = $1',
            [companyId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching registrations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createRegistration = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided to create a registration.' });
        }

        const { processId, timestamp, values, phase } = req.body;
        if (!processId || !timestamp || !values) {
            return res.status(400).json({ error: 'processId, timestamp, and values are required' });
        }

        const query = `
            INSERT INTO registrations (company_id, process_id, user_id, "timestamp", "values", phase)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, process_id AS "processId", "timestamp", "values", phase;
        `;
        const params = [
            companyId,
            processId,
            req.user.id,
            timestamp,
            JSON.stringify(values), // Ensure values are stringified for JSONB
            phase || 'default'
        ];

        const { rows } = await db.query(query, params);
        res.status(201).json(rows[0]);

    } catch (error) {
        console.error('Error creating registration:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getRegistrations,
    createRegistration
};