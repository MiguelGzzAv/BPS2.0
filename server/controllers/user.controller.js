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
        companyId: companyIdForNewUser
    };

    users.push(userToSave);
    console.log(`Added new user:`, userToSave);
    const { password, ...userWithoutPassword } = userToSave;
    res.status(201).json(userWithoutPassword);
};

module.exports = {
    getUsers,
    createUser
};