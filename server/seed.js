const mockData = require('./data/database');

// The seed function now accepts a database client to run all queries in a single connection.
// It no longer handles schema creation. Its only job is to populate the tables.
async function seed(client) {
    console.log('--- [Seeding] Starting data population ---');
    try {
        // Use the provided client for all queries
        const query = (text, params) => client.query(text, params);

        // 1. Seed Companies
        for (const company of mockData.companies) {
            await query('INSERT INTO companies (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [company.id, company.name]);
        }
        console.log('[Seeding] Companies seeded.');

        // 2. Seed Roles
        for (const role of mockData.roles) {
            await query(
                'INSERT INTO roles (id, name, is_system_role, company_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [role.id, role.name, role.is_system_role, role.company_id]
            );
        }
        console.log('[Seeding] Roles seeded.');

        // 3. Seed Users
        for (const user of mockData.users) {
            await query(
                'INSERT INTO users (id, name, username, password, is_superadmin, role_id, company_id, group_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                [user.id, user.name, user.username, user.password, user.is_superadmin || false, user.role_id, user.companyId, user.groupIds]
            );
        }
        console.log('[Seeding] Users seeded.');

        // 4. Seed Groups
        for (const companyId in mockData.groupsByCompany) {
            for (const group of mockData.groupsByCompany[companyId]) {
                await query(
                    'INSERT INTO groups (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                    [group.id, parseInt(companyId), group.name]
                );
            }
        }
        console.log('[Seeding] Groups seeded.');

        // 5. Seed Processes and related tables
        for (const companyId in mockData.processesByCompany) {
            for (const process of mockData.processesByCompany[companyId]) {
                await query(
                    'INSERT INTO processes (id, company_id, name, criticidad, start_time, end_time, frequency, days, mode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
                    [process.id, parseInt(companyId), process.name, process.criticidad, process.startTime, process.endTime, process.frequency, process.days, process.mode]
                );

                if (process.internalPhases) {
                    for (const [phaseIndex, phase] of process.internalPhases.entries()) {
                        const phaseResult = await query(
                            'INSERT INTO internal_phases (process_id, name, phase_order) VALUES ($1, $2, $3) RETURNING id',
                            [process.id, phase.name, phaseIndex]
                        );
                        const phaseId = phaseResult.rows[0].id;

                        if (phase.fields) {
                            for (const [fieldIndex, field] of phase.fields.entries()) {
                                await query(
                                    'INSERT INTO phase_fields (phase_id, name, type, field_order) VALUES ($1, $2, $3, $4)',
                                    [phaseId, field.name, field.type, fieldIndex]
                                );
                            }
                        }
                    }
                }

                if (process.childProcesses) {
                    for (const child of process.childProcesses) {
                        await query(
                            'INSERT INTO process_dependencies (parent_process_id, child_process_id, dependency) VALUES ($1, $2, $3) ON CONFLICT (parent_process_id, child_process_id) DO NOTHING',
                            [process.id, child.id, child.dependency]
                        );
                    }
                }
            }
        }
        console.log('[Seeding] Processes, phases, and dependencies seeded.');

        // 6. Seed Role Permissions
        for (const roleId in mockData.rolePermissions) {
            for (const resource in mockData.rolePermissions[roleId]) {
                const permissions = mockData.rolePermissions[roleId][resource];
                await query(
                    'INSERT INTO role_permissions (role_id, resource, "create", "read", "update", "delete") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (role_id, resource) DO NOTHING',
                    [parseInt(roleId), resource, permissions.create, permissions.read, permissions.update, permissions.delete]
                );
            }
        }
        console.log('[Seeding] Role permissions seeded.');

        // 7. Seed Maintenance Status
        for (const page in mockData.maintenanceStatus) {
            await query(
                'INSERT INTO maintenance_status (page, is_under_maintenance) VALUES ($1, $2) ON CONFLICT (page) DO NOTHING',
                [page, mockData.maintenanceStatus[page]]
            );
        }
        console.log('[Seeding] Maintenance status seeded.');

        console.log('--- [Seeding] Data population complete ---');

    } catch (error) {
        console.error('--- [Seeding] FAILED ---', error);
        // Re-throw the error to be caught by the initialization promise in db.js
        throw error;
    }
}

module.exports = seed;