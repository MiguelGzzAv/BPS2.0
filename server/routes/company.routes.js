const express = require('express');
const router = express.Router();
const {
    getCompanies,
    getCompanyById,
    createCompany,
    updateCompany,
    deleteCompany
} = require('../controllers/company.controller');

// Define routes for companies
router.get('/', getCompanies);
router.post('/', createCompany);
router.get('/:id', getCompanyById);
router.put('/:id', updateCompany);
router.delete('/:id', deleteCompany);

module.exports = router;