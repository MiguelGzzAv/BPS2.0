// --- Mock Data ---
const companies = [
    { id: 1, name: 'Banorte' },
    { id: 2, name: 'Banamex' },
    { id: 3, name: 'Santander' }
];
const processesByCompany = {
    '1': [
        {
            id: 'PRO7033',
            name: 'REPORTE DIARIO',
            criticidad: 'Media',
            startTime: '22:00',
            endTime: '22:30',
            frequency: 'Diario',
            days: [],
            mode: 'Individual',
            internalPhases: [
                { name: 'default', fields: [{ name: 'Status', type: 'status' }] }
            ],
            childProcesses: []
        },
        {
            id: 'PRO7032',
            name: 'PROCESO NOCTURNO BANORTE',
            criticidad: 'Alta',
            startTime: '21:00',
            endTime: '23:00',
            frequency: 'Diario',
            days: [],
            mode: 'Individual',
            internalPhases: [
                { name: 'default', fields: [{ name: 'Status', type: 'status' }, {name: 'Comentarios', type: 'text'}] }
            ],
            childProcesses: [{ id: 'PRO7033', dependency: true }]
        },
        {
            id: 'PRO7034',
            name: 'PROCESO DE FACTURACION',
            criticidad: 'Baja',
            startTime: '10:00',
            endTime: '12:00',
            frequency: 'Diario',
            days: [],
            mode: 'Multiple',
            internalPhases: [
                { name: 'Generar Facturas', fields: [{ name: 'Status', type: 'status' }, { name: 'Facturas Generadas', type: 'number' }] },
                { name: 'Enviar a Clientes', fields: [{ name: 'Status', type: 'status' }, { name: 'Correos Enviados', type: 'number' }] },
                { name: 'Confirmar Recepcion', fields: [{ name: 'Status', type: 'status' }] }
            ],
            childProcesses: []
        }
    ],
    '2': []
};
const roles = [
    { name: 'admin', companyId: 1, isSystemRole: false },
    { name: 'operator', companyId: 1, isSystemRole: false },
    { name: 'reader', companyId: 1, isSystemRole: false },
    { name: 'admin', companyId: 2, isSystemRole: false },
    { name: 'operator', companyId: 2, isSystemRole: false },
    { name: 'reader', companyId: 2, isSystemRole: false },
    { name: 'admin', isSystemRole: true }, // For general admin
];

const users = [
    { id: 1, name: 'Super Admin', username: 'superadmin', password: 'password123', role: 'superadmin' },
    { id: 2, name: 'Admin Banorte', username: 'admin_banorte', password: 'password123', role: 'admin', companyId: 1, groupIds: [1] },
    { id: 3, name: 'Operator Banorte', username: 'operator_banorte', password: 'password123', role: 'operator', companyId: 1 },
    { id: 4, name: 'Reader Banorte', username: 'reader_banorte', password: 'password123', role: 'reader', companyId: 1 },
    { id: 5, name: 'Admin Banamex', username: 'admin_banamex', password: 'password123', role: 'admin', companyId: 2 },
    { id: 6, name: 'Operator Banamex', username: 'operator_banamex', password: 'password123', role: 'operator', companyId: 2 },
    { id: 7, name: 'Reader Banamex', username: 'reader_banamex', password: 'password123', role: 'reader', companyId: 2 },
];
const groupsByCompany = {
    '1': [
        { id: 1, name: 'Administrators' },
        { id: 2, name: 'Operators' }
    ]
};
const registrationsByCompany = {};
const escalationsByCompany = {};
const permissionsByCompany = {
    '1': {
        // Granting full page access to the Administrators group
        '1': ['dashboard', 'users', 'groups', 'processes', 'monitoring', 'escalation', 'permissions', 'messaging', 'maintenance']
    }
};

const rolePermissionsByCompany = {
    '1': { // Default permissions for Banorte
        'admin': {
            'users': { create: true, read: true, update: true, delete: false },
            'groups': { create: true, read: true, update: true, delete: true },
            'processes': { create: true, read: true, update: true, delete: true },
            'permissions': { read: true, update: true }
        },
        'operator': {
            'registrations': { create: true, read: true, update: false, delete: false },
            'processes': { read: true },
        },
         'reader': {
            'processes': { read: true },
            'users': { read: true },
            'groups': { read: true },
        }
    }
};

const maintenanceStatus = {
    dashboard: false,
    users: false,
    groups: false,
    processes: false,
    monitoring: false,
    escalation: false,
};

const globalMessages = [];

module.exports = {
    companies,
    roles,
    processesByCompany,
    users,
    groupsByCompany,
    registrationsByCompany,
    escalationsByCompany,
    permissionsByCompany,
    rolePermissionsByCompany,
    maintenanceStatus,
    globalMessages,
};