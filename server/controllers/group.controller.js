const { groupsByCompany } = require('../data/database');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

const getGroups = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const groups = groupsByCompany[companyId] || [];
    res.json(groups);
};

const createGroup = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    const { id, name } = req.body;
    if (!id || !name) {
        return res.status(400).json({ error: 'Group ID and name are required' });
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Group ID must be a valid number.' });
    }

    if (!groupsByCompany[companyId]) {
        groupsByCompany[companyId] = [];
    }

    // Check if group with the same ID already exists for this company
    const existingGroup = groupsByCompany[companyId].find(g => g.id === numericId);
    if (existingGroup) {
        return res.status(409).json({ error: `Group with ID ${numericId} already exists in this company.` });
    }

    const newGroup = { id: numericId, name };
    groupsByCompany[companyId].push(newGroup);
    console.log(`Added new group to company ${companyId}:`, newGroup);
    res.status(201).json(newGroup);
};

const updateGroup = (req, res) => {
    const companyId = getCompanyId(req);
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
    const companyId = getCompanyId(req);
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