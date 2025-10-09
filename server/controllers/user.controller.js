const db = require('../db');

const getUsers = async (req, res) => {
    try {
        const companyId = req.user.is_superadmin ? req.query.companyId : req.user.companyId;
        const companyIdAsInt = parseInt(companyId, 10);

        let query;
        const params = [];

        const baseQuery = `
            SELECT
                u.id, u.name, u.username, u.is_superadmin, u.role_id, u.company_id AS "companyId",
                u.group_ids AS "groupIds", c.name AS "companyName", r.name AS "role_name"
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            LEFT JOIN roles r ON u.role_id = r.id
        `;

        if (!isNaN(companyIdAsInt) && companyIdAsInt > 0) {
            query = `${baseQuery} WHERE u.company_id = $1 ORDER BY u.name`;
            params.push(companyIdAsInt);
        } else if (req.user.is_superadmin) {
            query = `${baseQuery} ORDER BY u.name`;
        } else {
            return res.json([]);
        }

        const { rows } = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createUser = async (req, res) => {
    try {
        const newUser = req.body;
        const companyId = req.user.is_superadmin ? newUser.companyId : req.user.companyId;

        if (!newUser.username || !newUser.name || !newUser.password || !newUser.role_id) {
            return res.status(400).json({ error: 'Username, name, password, and role are required.' });
        }

        const query = `
            INSERT INTO users (name, username, password, is_superadmin, role_id, company_id, group_ids)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, username, is_superadmin, role_id, company_id AS "companyId", group_ids AS "groupIds"
        `;
        const params = [
            newUser.name,
            newUser.username,
            newUser.password, // This should be hashed in a real app
            newUser.is_superadmin || false,
            newUser.role_id,
            companyId,
            newUser.groupIds || []
        ];

        const { rows } = await db.query(query, params);
        res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const updateUser = async (req, res) => {
    try {
        const userIdToUpdate = parseInt(req.params.id);
        const updates = req.body;

        if (updates.role_id && userIdToUpdate === req.user.id && !req.user.is_superadmin) {
           return res.status(403).json({ error: 'Forbidden: You cannot change your own role.' });
        }

        const queryParts = [];
        const queryParams = [];
        let paramIndex = 1;

        const fieldMapping = {
            name: 'name',
            username: 'username',
            role_id: 'role_id',
            companyId: 'company_id',
            groupIds: 'group_ids',
            password: 'password'
        };

        for (const key in updates) {
            if (fieldMapping[key] && updates[key] !== undefined) {
                if (key === 'password' && !updates.password) continue;
                queryParts.push(`${fieldMapping[key]} = $${paramIndex++}`);
                queryParams.push(updates[key]);
            }
        }

        if (queryParts.length === 0) {
            const userResult = await db.query('SELECT id, name, username, role_id, company_id AS "companyId", group_ids AS "groupIds" FROM users WHERE id = $1', [userIdToUpdate]);
            return res.json(userResult.rows[0]);
        }

        queryParams.push(userIdToUpdate);

        const query = `
            UPDATE users
            SET ${queryParts.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, username, role_id, company_id AS "companyId", group_ids AS "groupIds"
        `;

        const { rows } = await db.query(query, queryParams);
        res.json(rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = parseInt(req.params.id);

        if (userIdToDelete === req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You cannot delete yourself.' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};