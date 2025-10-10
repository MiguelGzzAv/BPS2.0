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

        // Find the operator's user ID from the form values.
        const operatorValue = values.find(v => v.name.toLowerCase() === 'responsable');
        let userIdToRegister = req.user.id; // Default to the logged-in user

        if (operatorValue && operatorValue.value) {
            const userResult = await db.query('SELECT id FROM users WHERE name = $1 AND company_id = $2', [operatorValue.value, companyId]);
            if (userResult.rows.length > 0) {
                userIdToRegister = userResult.rows[0].id;
            } else {
                // If the selected operator is not found, we can either throw an error or use the logged-in user.
                // Using the logged-in user is a safe fallback.
                console.warn(`Operator "${operatorValue.value}" not found. Falling back to logged-in user ID ${req.user.id}.`);
            }
        }

        // The superadmin (ID 0) cannot be the author of a registration because they don't exist in the 'users' table.
        // This check prevents a foreign key violation if the superadmin is logged in and no valid 'responsable' is chosen.
        if (userIdToRegister === 0) {
            return res.status(400).json({ error: "A valid 'Responsable' must be selected to create a registration." });
        }

        const query = `
            INSERT INTO registrations (company_id, process_id, user_id, "timestamp", "values", phase)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, process_id AS "processId", "timestamp", "values", phase;
        `;
        const params = [
            companyId,
            processId,
            userIdToRegister, // Use the determined user ID
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