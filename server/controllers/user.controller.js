const db = require('../db');
const { hasPermission } = require('../utils/permissionUtils');

const getUsers = async (req, res) => {
    try {
        const companyId = req.user.role === 'superadmin' ? (req.query.companyId || req.user.companyId) : req.user.companyId;

        if (!await hasPermission(req.user.role, 'users', 'read', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to view users.' });
        }

        let query;
        const params = [];
        if (req.user.role === 'superadmin' && !req.query.companyId) {
            query = `
                SELECT u.id, u.name, u.username, r.name AS role, u.company_id AS "companyId", u.group_ids AS "groupIds", c.name AS "companyName", u.role_id as "roleId"
                FROM users u
                LEFT JOIN companies c ON u.company_id = c.id
                LEFT JOIN roles r ON u.role_id = r.id
            `;
        } else {
            query = `
                SELECT u.id, u.name, u.username, r.name AS role, u.company_id AS "companyId", u.group_ids AS "groupIds", c.name AS "companyName", u.role_id as "roleId"
                FROM users u
                LEFT JOIN companies c ON u.company_id = c.id
                LEFT JOIN roles r ON u.role_id = r.id
                WHERE u.company_id = $1
            `;
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
            if (newUser.role !== 'superadmin' && !companyIdForNewUser) {
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
            RETURNING id, name, username, role_id AS "roleId", company_id AS "companyId", group_ids AS "groupIds"
        `;
        const params = [
            newUser.name,
            newUser.username,
            newUser.password, // In a real app, hash this password!
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

        // First, get the user to check for existence and permissions
        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userIdToUpdate]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userToUpdate = userResult.rows[0];
        const companyId = userToUpdate.company_id;

        if (!await hasPermission(req.user.role, 'users', 'update', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to update users.' });
        }

        // Prevent role escalation by non-superadmins
        if (updates.roleId && updates.roleId !== userToUpdate.role_id && req.user.role !== 'superadmin') {
           return res.status(403).json({ error: 'Forbidden: You do not have permission to change user roles.'});
        }

        // Dynamically build the update query
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
                // Special handling for password, which shouldn't be updated if empty string
                if (key === 'password' && !updates.password) continue;

                queryParts.push(`${fieldMapping[key]} = $${paramIndex++}`);
                queryParams.push(updates[key]);
            }
        }

        if (queryParts.length === 0) {
            // If nothing to update, just return the user data without the password
            const { password, ...userWithoutPassword } = userToUpdate;
            // Map snake_case from DB to camelCase for the response
            userWithoutPassword.companyId = userWithoutPassword.company_id;
            userWithoutPassword.groupIds = userWithoutPassword.group_ids;
            delete userWithoutPassword.company_id;
            delete userWithoutPassword.group_ids;
            return res.json(userWithoutPassword);
        }

        queryParams.push(userIdToUpdate);

        const query = `
            UPDATE users
            SET ${queryParts.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id, name, username, role_id AS "roleId", company_id AS "companyId", group_ids AS "groupIds"
        `;

        const { rows } = await db.query(query, queryParams);

        // Fetch the role name to return it along with the updated user
        const roleResult = await db.query('SELECT name FROM roles WHERE id = $1', [rows[0].roleId]);
        const roleName = roleResult.rows.length > 0 ? roleResult.rows[0].name : null;

        res.json({ ...rows[0], role: roleName });

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