const db = require('../db');

const getLatestMessage = async (req, res) => {
    try {
        const { rows } = await db.query(
            'SELECT id, message, type, created_at AS "timestamp" FROM global_messages ORDER BY created_at DESC LIMIT 1'
        );
        const latestMessage = rows.length > 0 ? rows[0] : null;
        res.status(200).json(latestMessage);
    } catch (error) {
        console.error('Error fetching latest message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createMessage = async (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to perform this action.' });
    }

    const { message, type = 'info' } = req.body; // Default type to 'info'

    if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ error: 'Invalid payload. A non-empty "message" string is required.' });
    }

    try {
        const query = `
            INSERT INTO global_messages (message, type)
            VALUES ($1, $2)
            RETURNING id, message, type, created_at AS "timestamp"
        `;
        const { rows } = await db.query(query, [message.trim(), type]);

        res.status(201).json({ message: 'Message created successfully.', createdMessage: rows[0] });
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getLatestMessage,
    createMessage,
};