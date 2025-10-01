const { companies } = require('../data/database');

const getCompanies = (req, res) => {
    if (req.user.role === 'superadmin') {
        res.json(companies);
    } else {
        const userCompany = companies.find(c => c.id === req.user.companyId);
        res.json(userCompany ? [userCompany] : []);
    }
};

const getCompanyById = (req, res) => {
    const { id } = req.params;
    if (req.user.role !== 'superadmin' && req.user.companyId !== parseInt(id)) {
        return res.status(403).json({ error: 'Forbidden: You can only view your own company.' });
    }
    const company = companies.find(c => c.id === parseInt(id));
    if (company) {
        res.json(company);
    } else {
        res.status(404).json({ error: 'Company not found' });
    }
};

const createCompany = (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can create companies.' });
    }
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
    const newCompany = { id: newId, name };
    companies.push(newCompany);
    res.status(201).json(newCompany);
};

const updateCompany = (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can update companies.' });
    }
    const { id } = req.params;
    const { name } = req.body;
    const company = companies.find(c => c.id === parseInt(id));
    if (!company) {
        return res.status(404).json({ error: 'Company not found' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Company name is required' });
    }
    company.name = name;
    res.json(company);
};

const deleteCompany = (req, res) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'Forbidden: Only superadmins can delete companies.' });
    }
    const { id } = req.params;
    const companyIndex = companies.findIndex(c => c.id === parseInt(id));
    if (companyIndex === -1) {
        return res.status(404).json({ error: 'Company not found' });
    }
    companies.splice(companyIndex, 1);
    res.status(204).send();
};

module.exports = {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany
};