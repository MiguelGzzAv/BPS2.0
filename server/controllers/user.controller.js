const { users, companies } = require('../data/database');

const getUsers = (req, res) => {
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

    if (req.user.role === 'admin' && (newUser.role === 'admin' || newUser.role === 'superadmin')) {
        return res.status(403).json({ error: 'Forbidden: Admins cannot create other admins or superadmins.' });
    }

    if (!newUser.username || !newUser.name || !newUser.role) {
         return res.status(400).json({ error: 'Username, name, and role are required' });
    }

    let companyIdForNewUser;
    if (req.user.role === 'superadmin') {
        companyIdForNewUser = newUser.companyId;
        if (newUser.role !== 'superadmin' && !companyIdForNewUser) {
            return res.status(400).json({ error: 'Superadmin must specify a companyId for non-superadmin users' });
        }
    } else {
        companyIdForNewUser = req.user.companyId;
    }

    const userToSave = {
        id: Date.now(),
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        username: newUser.username,
        password: newUser.password, // In a real app, hash this
        role: newUser.role,
        companyId: companyIdForNewUser,
        groupIds: newUser.groupIds || []
    };

    users.push(userToSave);
    console.log(`Added new user:`, userToSave);
    const { password, ...userWithoutPassword } = userToSave;
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

    // Authorization checks
    if (req.user.role === 'admin') {
        // Admins can't edit superadmins or other admins
        if (userToUpdate.role === 'superadmin' || (userToUpdate.role === 'admin' && userToUpdate.id !== req.user.id)) {
            return res.status(403).json({ error: 'Forbidden: Admins cannot edit other admins or superadmins.' });
        }
        // Admins can only edit users within their own company
        if (userToUpdate.companyId !== req.user.companyId) {
            return res.status(403).json({ error: "Forbidden: You cannot edit users from another company." });
        }
    }

    // Prevent role escalation
    if (updates.role && req.user.role !== 'superadmin') {
        delete updates.role;
    }

    // Update user data (omitting password for simplicity, should be handled separately)
    const { password, ...safeUpdates } = updates;
    const updatedUser = { ...userToUpdate, ...safeUpdates };
    users[userIndex] = updatedUser;

    console.log(`Updated user ${userIdToUpdate}:`, updatedUser);
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
};

const deleteUser = (req, res) => {
    const userIdToDelete = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userIdToDelete);

    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = users[userIndex];

    // Authorization checks
    if (req.user.role === 'admin') {
        if (userToDelete.role === 'superadmin' || userToDelete.role === 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admins cannot delete other admins or superadmins.' });
        }
        if (userToDelete.companyId !== req.user.companyId) {
            return res.status(403).json({ error: "Forbidden: You cannot delete users from another company." });
        }
    }

    if (userToDelete.id === req.user.id) {
        return res.status(403).json({ error: 'Forbidden: You cannot delete yourself.' });
    }

    users.splice(userIndex, 1);
    console.log(`Deleted user ${userIdToDelete}`);
    res.status(204).send();
};


module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};