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
    let companyId;
    if (req.user.role === 'superadmin') {
        companyId = req.body.companyId;
    } else {
        companyId = req.user.companyId;
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
    let companyId;
    if (req.user.role === 'superadmin') {
        companyId = req.body.companyId;
    } else {
        companyId = req.user.companyId;
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