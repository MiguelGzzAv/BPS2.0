const fs = require('fs');
const path = require('path');
const db = require('./db');
const mockData = require('./data/database');

async function seed() {
    try {
        // Read the SQL file
        const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql')).toString();

        // Execute the SQL script to create tables
        await db.query(initSQL);
        console.log('Tables created successfully.');

        // Seed Companies
        for (const company of mockData.companies) {
            await db.query('INSERT INTO companies (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING', [company.id, company.name]);
        }
        console.log('Companies seeded.');

        // Seed Roles and get their IDs
        const roleNameToIdMap = new Map();
        for (const role of mockData.roles) {
            const res = await db.query(
                'INSERT INTO roles (company_id, name, is_system_role) VALUES ($1, $2, $3) ON CONFLICT (company_id, name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name',
                [role.companyId, role.name, role.isSystemRole]
            );
            if (res.rows[0]) {
                // Use a composite key for company-specific roles to avoid name clashes in the map
                const mapKey = role.companyId ? `${role.name}_${role.companyId}` : role.name;
                roleNameToIdMap.set(mapKey, res.rows[0].id);
            }
        }
        console.log('Roles seeded.');


        // Seed Users
        for (const user of mockData.users) {
             if (user.username === 'superadmin') continue; // Skip superadmin, not a DB user
            const userRoleMapKey = user.companyId ? `${user.role}_${user.companyId}` : user.role;
            const roleId = roleNameToIdMap.get(userRoleMapKey);
            if (!roleId) {
                console.warn(`Warning: Role '${user.role}' not found for user '${user.username}'. Skipping user.`);
                continue;
            }
            await db.query(
                'INSERT INTO users (id, name, username, password, role_id, company_id, group_ids) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
                [user.id, user.name, user.username, user.password, roleId, user.companyId, user.groupIds]
            );
        }
        console.log('Users seeded.');

        // Seed Groups
        for (const companyId in mockData.groupsByCompany) {
            for (const group of mockData.groupsByCompany[companyId]) {
                await db.query(
                    'INSERT INTO groups (id, company_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                    [group.id, parseInt(companyId), group.name]
                );
            }
        }
        console.log('Groups seeded.');

        // Seed Processes and related tables
        for (const companyId in mockData.processesByCompany) {
            for (const process of mockData.processesByCompany[companyId]) {
                await db.query(
                    'INSERT INTO processes (id, company_id, name, criticidad, start_time, end_time, frequency, days, mode) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
                    [process.id, parseInt(companyId), process.name, process.criticidad, process.startTime, process.endTime, process.frequency, process.days, process.mode]
                );

                // Seed Internal Phases and Fields
                for (const [phaseIndex, phase] of process.internalPhases.entries()) {
                    const phaseResult = await db.query(
                        'INSERT INTO internal_phases (process_id, name, phase_order) VALUES ($1, $2, $3) RETURNING id',
                        [process.id, phase.name, phaseIndex]
                    );
                    const phaseId = phaseResult.rows[0].id;

                    for (const [fieldIndex, field] of phase.fields.entries()) {
                        await db.query(
                            'INSERT INTO phase_fields (phase_id, name, type, field_order) VALUES ($1, $2, $3, $4)',
                            [phaseId, field.name, field.type, fieldIndex]
                        );
                    }
                }

                // Seed Process Dependencies
                for (const child of process.childProcesses) {
                    await db.query(
                        'INSERT INTO process_dependencies (parent_process_id, child_process_id, dependency) VALUES ($1, $2, $3) ON CONFLICT (parent_process_id, child_process_id) DO NOTHING',
                        [process.id, child.id, child.dependency]
                    );
                }
            }
        }
        console.log('Processes, phases, and dependencies seeded.');

        // Seed Permissions
        for (const companyId in mockData.permissionsByCompany) {
            for (const groupId in mockData.permissionsByCompany[companyId]) {
                for (const pageId of mockData.permissionsByCompany[companyId][groupId]) {
                     // Ensure the group exists before inserting permission
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
        console.log('Permissions seeded.');

        // Seed Role Permissions
        for (const companyId in mockData.rolePermissionsByCompany) {
            for (const roleName in mockData.rolePermissionsByCompany[companyId]) {
                const mapKey = companyId ? `${roleName}_${companyId}` : roleName;
                const roleId = roleNameToIdMap.get(mapKey);
                if (!roleId) {
                    console.warn(`Warning: Role '${roleName}' for company '${companyId}' not found for permissions. Skipping.`);
                    continue;
                }
                for (const resource in mockData.rolePermissionsByCompany[companyId][roleName]) {
                    const permissions = mockData.rolePermissionsByCompany[companyId][roleName][resource];
                    await db.query(
                        'INSERT INTO role_permissions (role_id, resource, "create", "read", "update", "delete") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (role_id, resource) DO NOTHING',
                        [roleId, resource, permissions.create, permissions.read, permissions.update, permissions.delete]
                    );
                }
            }
        }
        console.log('Role permissions seeded.');

        // Seed Maintenance Status
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
    } finally {
        // We don't end the pool here as the application might still be running
    }
}

// Run the seed function if the script is executed directly
if (require.main === module) {
    seed();
}

module.exports = seed;