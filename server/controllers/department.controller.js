const { departmentsByCompany } = require('../data/database');

const getCompanyId = (req) => {
    if (req.user.role === 'superadmin') {
        return req.query.companyId || req.body.companyId;
    }
    return req.user.companyId;
};

const getDepartments = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const departments = departmentsByCompany[companyId] || [];
    res.json(departments);
};

const createDepartment = (req, res) => {
    const companyId = getCompanyId(req);
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }
    if (!departmentsByCompany[companyId]) {
        departmentsByCompany[companyId] = [];
    }
    const newDepartment = { id: Date.now(), name };
    departmentsByCompany[companyId].push(newDepartment);
    console.log(`Added new department to company ${companyId}:`, newDepartment);
    res.status(201).json(newDepartment);
};

const updateDepartment = (req, res) => {
    const companyId = getCompanyId(req);
    const departmentId = parseInt(req.params.id);
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Department name is required' });
    }

    if (!departmentsByCompany[companyId]) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const departmentIndex = departmentsByCompany[companyId].findIndex(d => d.id === departmentId);

    if (departmentIndex === -1) {
        return res.status(404).json({ error: 'Department not found' });
    }

    const updatedDepartment = { ...departmentsByCompany[companyId][departmentIndex], name };
    departmentsByCompany[companyId][departmentIndex] = updatedDepartment;

    console.log(`Updated department ${departmentId} in company ${companyId}:`, updatedDepartment);
    res.json(updatedDepartment);
};

const deleteDepartment = (req, res) => {
    const companyId = getCompanyId(req);
    const departmentId = parseInt(req.params.id);

    if (!departmentsByCompany[companyId]) {
        return res.status(404).json({ error: 'Company not found' });
    }

    const initialLength = departmentsByCompany[companyId].length;
    departmentsByCompany[companyId] = departmentsByCompany[companyId].filter(d => d.id !== departmentId);

    if (departmentsByCompany[companyId].length === initialLength) {
        return res.status(404).json({ error: 'Department not found' });
    }

    console.log(`Deleted department ${departmentId} from company ${companyId}`);
    res.status(204).send();
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment
};