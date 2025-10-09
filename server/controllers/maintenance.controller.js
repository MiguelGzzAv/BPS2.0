const db = require('../db');

const getMaintenanceStatus = async (req, res) => {
    try {
        const { rows } = await db.query('SELECT page, is_under_maintenance FROM maintenance_status');
        const statusObject = rows.reduce((acc, row) => {
            acc[row.page] = row.is_under_maintenance;
            return acc;
        }, {});
        res.status(200).json(statusObject);
    } catch (error) {
        console.error('Error fetching maintenance status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateMaintenanceStatus = async (req, res) => {
    // Permission is now handled by the checkPermission('maintenance') middleware in the route.
    // No additional manual check is needed here, which makes the controller cleaner and respects the RBAC system.
    const newStatus = req.body;
    if (typeof newStatus !== 'object' || newStatus === null) {
        return res.status(400).json({ error: 'Invalid payload. Expected an object.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        let updated = false;
        for (const page in newStatus) {
            const pageExistsResult = await client.query('SELECT 1 FROM maintenance_status WHERE page = $1', [page]);
            if (pageExistsResult.rows.length > 0) {
                 await client.query(
                    'UPDATE maintenance_status SET is_under_maintenance = $1 WHERE page = $2',
                    [!!newStatus[page], page]
                );
                updated = true;
            }
        }

        if (!updated) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid payload. No valid page keys found.' });
        }

        await client.query('COMMIT');

        const { rows } = await db.query('SELECT page, is_under_maintenance FROM maintenance_status');
        const updatedStatusObject = rows.reduce((acc, row) => {
            acc[row.page] = row.is_under_maintenance;
            return acc;
        }, {});

        res.status(200).json({ message: 'Maintenance status updated successfully.', status: updatedStatusObject });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating maintenance status:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getMaintenanceStatus,
    updateMaintenanceStatus,
};