const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];

// Define roles for each company.
const roles = [
    // Banorte Roles
    { id: 1, company_id: 1, name: 'admin', is_system_role: true },
    { id: 2, company_id: 1, name: 'operator', is_system_role: false },
    { id: 3, company_id: 1, name: 'reader', is_system_role: false },
    // Banamex Roles
    { id: 4, company_id: 2, name: 'admin', is_system_role: true },
    { id: 5, company_id: 2, name: 'operator', is_system_role: false },
];

// Define users with the new structure
const users = [
    { id: 1, name: 'Super Admin', username: 'superadmin', password: 'password123', is_superadmin: true, role_id: null, companyId: null, groupIds: [] },
    { id: 2, name: 'Admin Banorte', username: 'admin_banorte', password: 'password123', is_superadmin: false, role_id: 1, companyId: 1, groupIds: [1] },
    { id: 3, name: 'Operator Banorte', username: 'operator_banorte', password: 'password123', is_superadmin: false, role_id: 2, companyId: 1, groupIds: [] },
    { id: 4, name: 'Reader Banorte', username: 'reader_banorte', password: 'password123', is_superadmin: false, role_id: 3, companyId: 1, groupIds: [] },
    { id: 5, name: 'Admin Banamex', username: 'admin_banamex', password: 'password123', is_superadmin: false, role_id: 4, companyId: 2, groupIds: [] },
];

const processesByCompany = {
    '1': [
        {
            id: 'PRO7033', name: 'REPORTE DIARIO', criticidad: 'Media', startTime: '22:00', endTime: '22:30', frequency: 'Diario', days: [], mode: 'Individual',
            internalPhases: [{ name: 'default', fields: [{ name: 'Status', type: 'status' }] }], childProcesses: []
        },
        {
            id: 'PRO7032', name: 'PROCESO NOCTURNO BANORTE', criticidad: 'Alta', startTime: '21:00', endTime: '23:00', frequency: 'Diario', days: [], mode: 'Individual',
            internalPhases: [{ name: 'default', fields: [{ name: 'Status', type: 'status' }, {name: 'Comentarios', type: 'text'}] }], childProcesses: [{ id: 'PRO7033', dependency: true }]
        },
    ],
    '2': []
};

const groupsByCompany = {
    '1': [
        { id: 1, name: 'Administrators' },
        { id: 2, name: 'Operators' }
    ]
};

const permissionsByCompany = {
    '1': {
        '1': ['dashboard', 'users']
    }
};

// Define role permissions using the new role_id
const rolePermissions = {
    // Banorte Admin (role_id: 1)
    '1': {
        'users': { create: true, read: true, update: true, delete: true },
        'groups': { create: true, read: true, update: true, delete: true },
        'processes': { create: true, read: true, update: true, delete: true },
        'permissions': { read: true, update: true },
        'role-permissions': { read: true, update: true },
        'roles': { create: true, read: true, update: true, delete: true },
    },
    // Banorte Operator (role_id: 2)
    '2': {
        'registrations': { create: true, read: true, update: false, delete: false },
        'processes': { read: true },
    },
    // Banorte Reader (role_id: 3)
    '3': {
        'processes': { read: true },
        'users': { read: true },
        'groups': { read: true },
    }
};

const maintenanceStatus = {
    dashboard: false,
    users: false,
    processes: false,
};

module.exports = {
    companies,
    roles,
    users,
    groupsByCompany,
    processesByCompany,
    permissionsByCompany,
    rolePermissions,
    maintenanceStatus,
};