const db = require('../db');
const { hasPermission } = require('../utils/permissionUtils');

const getUsers = async (req, res) => {
    try {
        const baseQuery = `
            SELECT
                u.id,
                u.name,
                u.username,
                r.name AS role,
                u.company_id AS "companyId",
                u.group_ids AS "groupIds",
                c.name AS "companyName"
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN companies c ON u.company_id = c.id
        `;

        let query;
        const params = [];

        if (req.user.role === 'superadmin') {
            const companyId = req.query.companyId;
            if (companyId) {
                query = `${baseQuery} WHERE u.company_id = $1`;
                params.push(companyId);
            } else {
                query = baseQuery;
            }
        } else {
            const companyId = req.user.companyId;
            if (!companyId) {
                return res.status(400).json({ error: 'User is not associated with a company.' });
            }
            query = `${baseQuery} WHERE u.company_id = $1`;
            params.push(companyId);
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
        let companyIdForNewUser;

        if (req.user.role === 'superadmin') {
            companyIdForNewUser = newUser.companyId;
            if (newUser.roleId && !companyIdForNewUser) { // Assuming roleId is sent
                 return res.status(400).json({ error: 'Superadmin must specify a companyId for non-superadmin users' });
            }
        } else {
            companyIdForNewUser = req.user.companyId;
        }

        if (!await hasPermission(req.user.role, 'users', 'create', companyIdForNewUser)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to create users.' });
        }

        if (!newUser.username || !newUser.name || !newUser.roleId || !newUser.password) {
            return res.status(400).json({ error: 'Username, name, password, and roleId are required' });
        }

        const query = `
            INSERT INTO users (name, username, password, role_id, company_id, group_ids)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, username, role_id, company_id AS "companyId", group_ids AS "groupIds"
        `;
        const params = [
            newUser.name,
            newUser.username,
            newUser.password,
            newUser.roleId,
            companyIdForNewUser,
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

        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userIdToUpdate]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userToUpdate = userResult.rows[0];
        const companyId = userToUpdate.company_id;

        if (!await hasPermission(req.user.role, 'users', 'update', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to update users.' });
        }

        if (updates.roleId && updates.roleId !== userToUpdate.role_id && req.user.role !== 'superadmin') {
           return res.status(403).json({ error: 'Forbidden: You do not have permission to change user roles.'});
        }

        const queryParts = [];
        const queryParams = [];
        let paramIndex = 1;

        const fieldMapping = {
            name: 'name',
            username: 'username',
            roleId: 'role_id',
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
            const { password, ...userWithoutPassword } = userToUpdate;
            userWithoutPassword.companyId = userWithoutPassword.company_id;
            userWithoutPassword.groupIds = userWithoutPassword.group_ids;
            delete userWithoutPassword.company_id;
            delete userWithoutPassword.group_ids;
            return res.json(userWithoutPassword);
        }

        queryParams.push(userIdToUpdate);

        const finalQuery = `
            UPDATE users
            SET ${queryParts.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, username, role_id, company_id AS "companyId", group_ids AS "groupIds"
        `;

        const { rows } = await db.query(finalQuery, queryParams);
        // To return the role name, we'd need another query. For now, returning the ID is consistent.
        const updatedUser = rows[0];
        const roleRes = await db.query('SELECT name FROM roles WHERE id = $1', [updatedUser.role_id]);
        updatedUser.role = roleRes.rows[0]?.name;
        delete updatedUser.role_id;

        res.json(updatedUser);

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userIdToDelete = parseInt(req.params.id);

        // First, get the user to check for existence and permissions
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userIdToDelete]);
        if (userResult.rows.length === 0) {
            // No need to send error if user not found, deletion is idempotent
            return res.status(204).send();
        }
        const userToDelete = userResult.rows[0];
        const companyId = userToDelete.company_id;

        if (!await hasPermission(req.user.role, 'users', 'delete', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to delete users.' });
        }

        if (userToDelete.id === req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You cannot delete yourself.' });
        }

        await db.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);
        console.log(`Deleted user ${userIdToDelete}`);
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