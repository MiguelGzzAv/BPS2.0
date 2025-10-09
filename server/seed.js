const fs = require('fs');
const path = require('path');
const db = require('./db');
const mockData = require('./data/database');

async function seed() {
    try {
        const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();
        const statements = initSQL.split(';').filter(statement => statement.trim() !== '');

        console.log('--- Executing init.sql statements ---');
        for (const statement of statements) {
            console.log('Executing:', statement.substring(0, 100).replace(/\n/g, ' ') + '...');
            await db.query(statement);
        }
        console.log('--- All init.sql statements executed ---');
        console.log('Tables created successfully.');

        // 1. Seed Companies
        for (const company of mockData.companies) {
            await db.query('INSERT INTO companies (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [company.id, company.name]);
        }
        console.log('Companies seeded.');

        // 2. Seed Roles
        for (const role of mockData.roles) {
            await db.query(
                'INSERT INTO roles (id, name, is_system_role, company_id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [role.id, role.name, role.is_system_role, role.company_id]
            );
        }
        console.log('Roles seeded.');

        // 3. Seed Users (now with is_superadmin flag)
        for (const user of mockData.users) {
            await db.query(
                'INSERT INTO users (id, name, username, password, is_superadmin, role_id, company_id, group_ids) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
                [user.id, user.name, user.username, user.password, user.is_superadmin || false, user.role_id, user.companyId, user.groupIds]
            );
        }
        console.log('Users seeded.');

        // 4. Seed Groups
        for (const companyId in mockData.groupsByCompany) {
            for (const group of mockData.groupsByCompany[companyId]) {
                await db.query(
                    'INSERT INTO groups (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                    [group.id, parseInt(companyId), group.name]
                );
            }
        }
        console.log('Groups seeded.');

        // 5. Seed Processes and related tables
        for (const companyId in mockData.processesByCompany) {
            for (const process of mockData.processesByCompany[companyId]) {
                await db.query(
                    'INSERT INTO processes (id, company_id, name, criticidad, start_time, end_time, frequency, days, mode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
                    [process.id, parseInt(companyId), process.name, process.criticidad, process.startTime, process.endTime, process.frequency, process.days, process.mode]
                );

                if (process.internalPhases) {
                    for (const [phaseIndex, phase] of process.internalPhases.entries()) {
                        const phaseResult = await db.query(
                            'INSERT INTO internal_phases (process_id, name, phase_order) VALUES ($1, $2, $3) RETURNING id',
                            [process.id, phase.name, phaseIndex]
                        );
                        const phaseId = phaseResult.rows[0].id;

                        if (phase.fields) {
                            for (const [fieldIndex, field] of phase.fields.entries()) {
                                await db.query(
                                    'INSERT INTO phase_fields (phase_id, name, type, field_order) VALUES ($1, $2, $3, $4)',
                                    [phaseId, field.name, field.type, fieldIndex]
                                );
                            }
                        }
                    }
                }
            }
        }
        console.log('Processes and phases seeded.');

        // 6. Seed Group-based Page Permissions
        for (const companyId in mockData.permissionsByCompany) {
            for (const groupId in mockData.permissionsByCompany[companyId]) {
                for (const pageId of mockData.permissionsByCompany[companyId][groupId]) {
                    const groupExists = await db.query('SELECT id FROM groups WHERE id = $1', [groupId]);
                    if (groupExists.rows.length > 0) {
                        await db.query(
                            'INSERT INTO permissions (group_id, page_id) VALUES ($1, $2) ON CONFLICT (group_id, page_id) DO NOTHING',
                            [parseInt(groupId), pageId]
                        );
                    }
                }
            }
        }
        console.log('Page permissions seeded.');

        // 7. Seed Role Permissions
        for (const roleId in mockData.rolePermissions) {
            for (const resource in mockData.rolePermissions[roleId]) {
                const permissions = mockData.rolePermissions[roleId][resource];
                await db.query(
                    'INSERT INTO role_permissions (role_id, resource, "create", "read", "update", "delete") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (role_id, resource) DO NOTHING',
                    [parseInt(roleId), resource, permissions.create, permissions.read, permissions.update, permissions.delete]
                );
            }
        }
        console.log('Role permissions seeded.');

        // 8. Seed Maintenance Status
        for (const page in mockData.maintenanceStatus) {
            await db.query(
                'INSERT INTO maintenance_status (page, is_under_maintenance) VALUES ($1, $2) ON CONFLICT (page) DO NOTHING',
                [page, mockData.maintenanceStatus[page]]
            );
        }
        console.log('Maintenance status seeded.');

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

if (require.main === module) {
    seed();
}

module.exports = seed;