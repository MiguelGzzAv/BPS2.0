const db = require('../db');
const { hasPermission } = require('../utils/permissionUtils');

const { assembleProcessObjects, calculateAllProcessStates } = require('../utils/processUtils');


const getProcesses = async (req, res) => {
    try {
        let companyId;
        if (req.user.role === 'superadmin') {
            companyId = req.query.companyId;
        } else {
            companyId = req.user.companyId;
        }

        if (!companyId) {
            return res.status(400).json({ error: 'A companyId must be provided for this request.' });
        }

        if (!await hasPermission(req.user.role, 'processes', 'read', companyId)) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to view processes.' });
        }

        const { date } = req.query;
        const forDate = date ? new Date(`${date}T00:00:00Z`) : new Date();
        if (!date) forDate.setUTCHours(0, 0, 0, 0);

        // Fetch all required data in parallel
        const [processRes, phaseRes, fieldRes, depRes, regRes] = await Promise.all([
            db.query('SELECT id, name, criticidad, start_time, end_time, frequency, days, mode FROM processes WHERE company_id = $1', [companyId]),
            db.query('SELECT ip.id, ip.process_id, ip.name, ip.phase_order FROM internal_phases ip JOIN processes p ON ip.process_id = p.id WHERE p.company_id = $1', [companyId]),
            db.query('SELECT pf.id, pf.phase_id, pf.name, pf.type, pf.field_order FROM phase_fields pf JOIN internal_phases ip ON pf.phase_id = ip.id JOIN processes p ON ip.process_id = p.id WHERE p.company_id = $1', [companyId]),
            db.query('SELECT pd.parent_process_id, pd.child_process_id, pd.dependency FROM process_dependencies pd JOIN processes p ON pd.parent_process_id = p.id WHERE p.company_id = $1', [companyId]),
            db.query('SELECT process_id AS "processId", phase, "values", "timestamp" FROM registrations WHERE company_id = $1', [companyId])
        ]);

        const processes = assembleProcessObjects(processRes.rows, phaseRes.rows, fieldRes.rows, depRes.rows);
        const registrations = regRes.rows;

        // Calculate lock status based on the last 24 hours
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        const lastRegistrationMap = new Map();
        (registrations || []).forEach(reg => {
            const regTimestamp = new Date(reg.timestamp);
            if (!lastRegistrationMap.has(reg.processId) || regTimestamp > lastRegistrationMap.get(reg.processId)) {
                lastRegistrationMap.set(reg.processId, regTimestamp);
            }
        });

        const states = calculateAllProcessStates(processes, registrations, forDate);

        const processesWithStatusAndLock = processes.map(p => {
            const lastRegTime = lastRegistrationMap.get(p.id);
            const status = states.get(p.id) || 'sin ejecucion';

            // A process is locked if it was completed ('ok') within the last 24 hours.
            const isLocked = lastRegTime && status === 'ok' ? lastRegTime > twentyFourHoursAgo : false;

            return {
                ...p,
                // Map snake_case from DB to camelCase for consistency
                startTime: p.start_time,
                endTime: p.end_time,
                status: status,
                isLocked: isLocked,
            };
        });

        res.json(processesWithStatusAndLock);
    } catch (error) {
        console.error('Error fetching processes:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

const createProcess = async (req, res) => {
    const { processData, companyId: reqCompanyId } = req.body;
    const companyId = req.user.role === 'superadmin' ? reqCompanyId : req.user.companyId;

    if (!await hasPermission(req.user.role, 'processes', 'create', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to create processes.' });
    }
    if (!companyId) {
        return res.status(400).json({ error: 'Superadmin must provide a companyId to create a process.' });
    }
    if (!processData || !processData.id || !processData.name) {
        return res.status(400).json({ error: 'Process data (including id and name) is required.' });
    }

    const client = await db.getClient(); // Using a client for transaction
    try {
        await client.query('BEGIN');

        // Insert into processes table
        const processQuery = `
            INSERT INTO processes (id, company_id, name, criticidad, start_time, end_time, frequency, days, mode)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        const processParams = [
            processData.id, companyId, processData.name,
            processData.criticidad || 'Baja', processData.startTime, processData.endTime,
            processData.frequency, processData.days, processData.mode || 'Individual'
        ];
        const processResult = await client.query(processQuery, processParams);
        const newProcess = processResult.rows[0];

        // Insert internal phases and fields
        const phases = processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: [] }];
        for (const [phaseIndex, phase] of phases.entries()) {
            const phaseResult = await client.query(
                'INSERT INTO internal_phases (process_id, name, phase_order) VALUES ($1, $2, $3) RETURNING id',
                [newProcess.id, phase.name, phaseIndex]
            );
            const phaseId = phaseResult.rows[0].id;
            for (const [fieldIndex, field] of (phase.fields || []).entries()) {
                await client.query(
                    'INSERT INTO phase_fields (phase_id, name, type, field_order) VALUES ($1, $2, $3, $4)',
                    [phaseId, field.name, field.type, fieldIndex]
                );
            }
        }

        // Insert child process dependencies
        for (const child of (processData.childProcesses || [])) {
            await client.query(
                'INSERT INTO process_dependencies (parent_process_id, child_process_id, dependency) VALUES ($1, $2, $3)',
                [newProcess.id, child.id, child.dependency]
            );
        }

        await client.query('COMMIT');
        // Re-fetch the full process to return it
        res.status(201).json(processData); // Returning the input data as it's the most complete representation

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating process:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

const updateProcess = async (req, res) => {
    const { id } = req.params;
    const { processData, companyId: reqCompanyId } = req.body;
    const companyId = req.user.role === 'superadmin' ? reqCompanyId : req.user.companyId;

    if (!await hasPermission(req.user.role, 'processes', 'update', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to update processes.' });
    }
    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided to update a process.' });
    }
    if (!processData) {
        return res.status(400).json({ error: 'processData is required' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // Update the main process entry
        const processQuery = `
            UPDATE processes SET name = $1, criticidad = $2, start_time = $3, end_time = $4,
            frequency = $5, days = $6, mode = $7
            WHERE id = $8 AND company_id = $9
            RETURNING *;
        `;
        const processParams = [
            processData.name, processData.criticidad, processData.startTime, processData.endTime,
            processData.frequency, processData.days, processData.mode,
            id, companyId
        ];
        const processResult = await client.query(processQuery, processParams);
        if (processResult.rows.length === 0) {
            throw new Error('Process not found or companyId mismatch');
        }

        // --- Clear and Re-insert related data ---
        // Clear existing phases (cascades to fields) and dependencies
        await client.query('DELETE FROM internal_phases WHERE process_id = $1', [id]);
        await client.query('DELETE FROM process_dependencies WHERE parent_process_id = $1', [id]);

        // Re-insert internal phases and fields
        const phases = processData.internalPhases && processData.internalPhases.length > 0 ? processData.internalPhases : [{ name: 'default', fields: [] }];
        for (const [phaseIndex, phase] of phases.entries()) {
            const phaseResult = await client.query(
                'INSERT INTO internal_phases (process_id, name, phase_order) VALUES ($1, $2, $3) RETURNING id',
                [id, phase.name, phaseIndex]
            );
            const phaseId = phaseResult.rows[0].id;
            for (const [fieldIndex, field] of (phase.fields || []).entries()) {
                await client.query(
                    'INSERT INTO phase_fields (phase_id, name, type, field_order) VALUES ($1, $2, $3, $4)',
                    [phaseId, field.name, field.type, fieldIndex]
                );
            }
        }

        // Re-insert child process dependencies
        for (const child of (processData.childProcesses || [])) {
            await client.query(
                'INSERT INTO process_dependencies (parent_process_id, child_process_id, dependency) VALUES ($1, $2, $3)',
                [id, child.id, child.dependency]
            );
        }

        await client.query('COMMIT');
        res.json(processData); // Return the updated data

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating process ${id}:`, error);
        if (error.message === 'Process not found or companyId mismatch') {
            return res.status(404).json({ error: 'Process not found in the specified company' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

const deleteProcess = async (req, res) => {
    const { id } = req.params;
    let companyId;

    if (req.user.role === 'superadmin') {
        companyId = req.query.companyId;
    } else {
        companyId = req.user.companyId;
    }

    if (!companyId) {
        return res.status(400).json({ error: 'A companyId must be provided for this request.' });
    }

    if (!await hasPermission(req.user.role, 'processes', 'delete', companyId)) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to delete processes.' });
    }

    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        // First, remove the process from any other process's dependency list.
        await client.query('DELETE FROM process_dependencies WHERE child_process_id = $1', [id]);

        // Now, delete the process itself. Cascading deletes will handle its own phases, fields, and parent-dependencies.
        const result = await client.query('DELETE FROM processes WHERE id = $1 AND company_id = $2', [id, companyId]);

        if (result.rowCount === 0) {
            // If no rows were deleted, the process didn't exist for that company.
            // We can treat this as a success (idempotent) or a 404. Let's choose 404 for clarity.
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Process not found in the specified company' });
        }

        await client.query('COMMIT');
        res.status(204).send();

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting process ${id}:`, error);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getProcesses,
    createProcess,
    updateProcess,
    deleteProcess,
    calculateAllProcessStates
};