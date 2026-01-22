const db = require('../db');

const getEscalationRules = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.query.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        const { rows } = await db.query('SELECT * FROM escalation_rules WHERE company_id = $1', [companyId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching escalation rules:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createOrUpdateEscalationRule = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        const { id, processId, config } = req.body;
        if (!processId) {
            return res.status(400).json({ error: 'processId is required' });
        }

        if (id) {
            // Update existing rule
            const { rows } = await db.query(
                'UPDATE escalation_rules SET process_id = $1, config = $2 WHERE id = $3 AND company_id = $4 RETURNING *',
                [processId, JSON.stringify(config), id, companyId]
            );
            if (rows.length === 0) {
                return res.status(404).json({ error: 'Escalation rule not found' });
            }
            res.status(200).json(rows[0]);
        } else {
            // Create new rule
            const { rows } = await db.query(
                'INSERT INTO escalation_rules (company_id, process_id, config) VALUES ($1, $2, $3) RETURNING *',
                [companyId, processId, JSON.stringify(config)]
            );
            res.status(201).json(rows[0]);
        }
    } catch (error) {
        console.error('Error creating/updating escalation rule:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteEscalationRule = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.role === 'superadmin' ? (req.query.companyId || req.body.companyId) : req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        const result = await db.query('DELETE FROM escalation_rules WHERE id = $1 AND company_id = $2', [id, companyId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Escalation rule not found' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting escalation rule:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Also need to update the route export
module.exports = {
    getEscalationRules,
    createOrUpdateEscalationRule,
    deleteEscalationRule
};