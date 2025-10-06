const { groupsByCompany } = require('../data/database');
const { hasPermission } = require('../utils/permissionUtils');

const getGroups = (req, res) => {
    const companyId = req.user.role === 'superadmin' ? (req.query.companyId || req.user.companyId) : req.user.companyId;

    if (!hasPermission(req.user.role, 'groups', 'read', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view groups.' });
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const groups = groupsByCompany[companyId] || [];
    res.json(groups);
};

const createGroup = (req, res) => {
    const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;

    if (!hasPermission(req.user.role, 'groups', 'create', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to create groups.' });
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }
    if (!groupsByCompany[companyId]) {
        groupsByCompany[companyId] = [];
    }
    const newGroup = { id: Date.now(), name };
    groupsByCompany[companyId].push(newGroup);
    console.log(`Added new group to company ${companyId}:`, newGroup);
    res.status(201).json(newGroup);
};

const updateGroup = (req, res) => {
    const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;

    if (!hasPermission(req.user.role, 'groups', 'update', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update groups.' });
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    const groupId = parseInt(req.params.id);
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Group name is required' });
    }

    if (!groupsByCompany[companyId]) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const groupIndex = groupsByCompany[companyId].findIndex(g => g.id === groupId);

    if (groupIndex === -1) {
        return res.status(404).json({ error: 'Group not found' });
    }

    const updatedGroup = { ...groupsByCompany[companyId][groupIndex], name };
    groupsByCompany[companyId][groupIndex] = updatedGroup;

    console.log(`Updated group ${groupId} in company ${companyId}:`, updatedGroup);
    res.json(updatedGroup);
};

const deleteGroup = (req, res) => {
    const companyId = req.user.role === 'superadmin' ? req.body.companyId : req.user.companyId;

    if (!hasPermission(req.user.role, 'groups', 'delete', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete groups.' });
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    const groupId = parseInt(req.params.id);

    if (!groupsByCompany[companyId]) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const initialLength = groupsByCompany[companyId].length;
    groupsByCompany[companyId] = groupsByCompany[companyId].filter(g => g.id !== groupId);

    if (groupsByCompany[companyId].length === initialLength) {
        return res.status(404).json({ error: 'Group not found' });
    }

    console.log(`Deleted group ${groupId} from company ${companyId}`);
    res.status(204).send();
};

module.exports = {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup
};