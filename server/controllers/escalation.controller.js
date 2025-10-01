const { escalationsByCompany } = require('../data/database');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

const getEscalations = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const escalations = escalationsByCompany[companyId] || [];
    res.json(escalations);
};

const createOrUpdateEscalation = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const ruleData = req.body;
    if (!ruleData.processId) {
        return res.status(400).json({ error: 'processId is required' });
    }

    if (!escalationsByCompany[companyId]) {
        escalationsByCompany[companyId] = [];
    }
    const escalations = escalationsByCompany[companyId];

    const existingRuleIndex = ruleData.id ? escalations.findIndex(r => r.id === ruleData.id) : -1;

    if (existingRuleIndex > -1) {
        escalations[existingRuleIndex] = { ...escalations[existingRuleIndex], ...ruleData };
        console.log(`Updated escalation rule for company ${companyId}:`, escalations[existingRuleIndex]);
        res.status(200).json(escalations[existingRuleIndex]);
    } else {
        const newRule = { ...ruleData, id: Date.now() };
        escalations.push(newRule);
        console.log(`Added new escalation rule to company ${companyId}:`, newRule);
        res.status(201).json(newRule);
    }
};

const deleteEscalation = (req, res) => {
    const { id } = req.params;
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const escalations = escalationsByCompany[companyId] || [];
    const ruleIndex = escalations.findIndex(r => r.id === parseInt(id));
    if (ruleIndex === -1) {
        return res.status(404).json({ error: 'Escalation rule not found' });
    }
    escalations.splice(ruleIndex, 1);
    res.status(204).send();
};

module.exports = {
    getEscalations,
    createOrUpdateEscalation,
    deleteEscalation
};