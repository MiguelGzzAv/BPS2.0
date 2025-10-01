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

module.exports = {
    getGroups,
    createGroup
};