const { users, companies } = require('../data/database');
const { hasPermission } = require('../utils/permissionUtils');
const { logChange } = require('../utils/auditLogger.js');

const getUsers = (req, res) => {
    const companyId = req.user.role === 'superadmin' ? (req.query.companyId || req.user.companyId) : req.user.companyId;

    if (!hasPermission(req.user.role, 'users', 'read', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view users.' });
    }

    let usersToReturn = [];
    if (req.user.role === 'superadmin') {
        usersToReturn = users;
    } else {
        usersToReturn = users.filter(u => u.companyId === req.user.companyId);
    }

    const usersWithDetails = usersToReturn.map(u => {
        const company = companies.find(c => c.id === u.companyId);
        const { password, ...userWithoutPassword } = u;
        return { ...userWithoutPassword, companyName: company ? company.name : 'N/A' };
    });
    res.json(usersWithDetails);
};

const createUser = (req, res) => {
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

    if (!hasPermission(req.user.role, 'users', 'create', companyIdForNewUser)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to create users.' });
    }

    if (!newUser.username || !newUser.name || !newUser.role) {
         return res.status(400).json({ error: 'Username, name, and role are required' });
    }

    const userToSave = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        companyId: companyIdForNewUser,
        groupIds: newUser.groupIds || []
    };

    users.push(userToSave);
    const { password, ...userWithoutPassword } = userToSave;

    logChange(req.user.id, 'CREATE_USER', {
        createdUserId: userToSave.id,
        createdUserName: userToSave.name,
        companyId: userToSave.companyId,
    });

    console.log(`Added new user:`, userToSave);
    res.status(201).json(userWithoutPassword);
};

const updateUser = (req, res) => {
    const userIdToUpdate = parseInt(req.params.id);
    const updates = req.body;
    const userIndex = users.findIndex(u => u.id === userIdToUpdate);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userToUpdate = users[userIndex];
    const companyId = userToUpdate.companyId || req.user.companyId;

    if (!hasPermission(req.user.role, 'users', 'update', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update users.' });
    }

    // Prevent role escalation by non-superadmins
    if (updates.role && updates.role !== userToUpdate.role && req.user.role !== 'superadmin') {
       return res.status(403).json({ error: 'Forbidden: You do not have permission to change user roles.'});
    }

    const { password, ...safeUpdates } = updates;
    const updatedUser = { ...userToUpdate, ...safeUpdates };
    if (password) { // Only update password if a new one is provided
        updatedUser.password = password;
    }

    users[userIndex] = updatedUser;
    const { password: _, ...userWithoutPassword } = updatedUser;

    logChange(req.user.id, 'UPDATE_USER', {
        updatedUserId: userIdToUpdate,
        updatedFields: Object.keys(safeUpdates),
        companyId: updatedUser.companyId,
    });

    console.log(`Updated user ${userIdToUpdate}:`, updatedUser);
    res.json(userWithoutPassword);
};

const deleteUser = (req, res) => {
    const userIdToDelete = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userIdToDelete);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = users[userIndex];
    const companyId = userToDelete.companyId || req.user.companyId;

    if (!hasPermission(req.user.role, 'users', 'delete', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete users.' });
    }

    if (userToDelete.id === req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You cannot delete yourself.' });
    }

    const deletedUserName = userToDelete.name; // Capture name before deleting
    users.splice(userIndex, 1);

    logChange(req.user.id, 'DELETE_USER', {
        deletedUserId: userIdToDelete,
        deletedUserName: deletedUserName,
        companyId: companyId,
    });

    console.log(`Deleted user ${userIdToDelete}`);
    res.status(204).send();
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};