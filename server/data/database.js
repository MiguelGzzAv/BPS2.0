// --- Mock Data ---

const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];

// Define roles. System roles have a null company_id.
const roles = [
    // System Roles
    { id: 1, name: 'superadmin', is_system_role: true, company_id: null },

    // Company 1 (Banorte) Roles
    { id: 2, name: 'admin', is_system_role: false, company_id: 1 },
    { id: 3, name: 'operator', is_system_role: false, company_id: 1 },
    { id: 4, name: 'reader', is_system_role: false, company_id: 1 },

    // Company 2 (Banamex) Roles
    { id: 5, name: 'admin', is_system_role: false, company_id: 2 },
    { id: 6, name: 'operator', is_system_role: false, company_id: 2 },
    { id: 7, name: 'reader', is_system_role: false, company_id: 2 },
];

const users = [
    // Note: 'role' is replaced with 'role_id'
    { id: 1, name: 'Super Admin', username: 'superadmin', password: 'password123', role_id: 1, companyId: null, groupIds: [] },
    { id: 2, name: 'Admin Banorte', username: 'admin_banorte', password: 'password123', role_id: 2, companyId: 1, groupIds: [1] },
    { id: 3, name: 'Operator Banorte', username: 'operator_banorte', password: 'password123', role_id: 3, companyId: 1, groupIds: [] },
    { id: 4, name: 'Reader Banorte', username: 'reader_banorte', password: 'password123', role_id: 4, companyId: 1, groupIds: [] },
    { id: 5, name: 'Admin Banamex', username: 'admin_banamex', password: 'password123', role_id: 5, companyId: 2, groupIds: [] },
    { id: 6, name: 'Operator Banamex', username: 'operator_banamex', password: 'password123', role_id: 6, companyId: 2, groupIds: [] },
    { id: 7, name: 'Reader Banamex', username: 'reader_banamex', password: 'password123', role_id: 7, companyId: 2, groupIds: [] },
];

const groupsByCompany = {
    '1': [
        { id: 1, name: 'Administrators' },
        { id: 2, name: 'Operators' }
    ]
};

// Permissions are now keyed by role_id
const rolePermissions = {
    // Banorte Admin (role_id: 2)
    '2': {
        'users': { create: true, read: true, update: true, delete: false },
        'groups': { create: true, read: true, update: true, delete: true },
        'processes': { create: true, read: true, update: true, delete: true },
        'permissions': { read: true, update: true },
        'role-permissions': { read: true, update: true },
        'roles': { create: true, read: true, update: true, delete: true },
    },
    // Banorte Operator (role_id: 3)
    '3': {
        'registrations': { create: true, read: true, update: false, delete: false },
        'processes': { read: true },
    },
    // Banorte Reader (role_id: 4)
    '4': {
        'processes': { read: true },
        'users': { read: true },
        'groups': { read: true },
    },
    // Superadmin (role_id: 1) gets all permissions implicitly by middleware,
    // but we can define them here for completeness if needed elsewhere.
    '1': {
        'users': { create: true, read: true, update: true, delete: true },
        'groups': { create: true, read: true, update: true, delete: true },
        'processes': { create: true, read: true, update: true, delete: true },
        'permissions': { create: true, read: true, update: true, delete: true },
        'role-permissions': { create: true, read: true, update: true, delete: true },
        'roles': { create: true, read: true, update: true, delete: true },
        'maintenance': { create: true, read: true, update: true, delete: true },
        'messaging': { create: true, read: true, update: true, delete: true },
        'database': { create: true, read: true, update: true, delete: true },
        'configuration': { create: true, read: true, update: true, delete: true },
        'registrations': { create: true, read: true, update: true, delete: true },
        'escalations': { create: true, read: true, update: true, delete: true },
    }
};

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
        {
            id: 'PRO7034', name: 'PROCESO DE FACTURACION', criticidad: 'Baja', startTime: '10:00', endTime: '12:00', frequency: 'Diario', days: [], mode: 'Multiple',
            internalPhases: [
                { name: 'Generar Facturas', fields: [{ name: 'Status', type: 'status' }, { name: 'Facturas Generadas', type: 'number' }] },
                { name: 'Enviar a Clientes', fields: [{ name: 'Status', type: 'status' }, { name: 'Correos Enviados', type: 'number' }] },
                { name: 'Confirmar Recepcion', fields: [{ name: 'Status', type: 'status' }] }
            ], childProcesses: []
        }
    ],
    '2': []
};

const permissionsByCompany = {
    '1': {
        '1': ['dashboard', 'users'] // Group 1 (Admins) can see dashboard and users
    }
};

const maintenanceStatus = {
    dashboard: false, users: false, groups: false, processes: false,
    monitoring: false, escalation: false,
};

module.exports = {
    companies,
    roles, // Export new roles data
    users,
    groupsByCompany,
    rolePermissions, // Export new rolePermissions data
    processesByCompany,
    permissionsByCompany,
    maintenanceStatus,
};