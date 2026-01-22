-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS process_dependencies, phase_fields, internal_phases, processes, role_permissions, roles, groups, users, companies, registrations, escalation_rules, escalation_events, maintenance_status, global_messages CASCADE;

-- Table for Companies
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Table for Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    is_system_role BOOLEAN DEFAULT false,
    UNIQUE(company_id, name)
);

-- Table for Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    company_id INTEGER REFERENCES companies(id),
    group_ids INTEGER[]
);

-- Table for Groups
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL
);

-- Table for Processes
CREATE TABLE processes (
    id VARCHAR(255) PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    criticidad VARCHAR(50),
    start_time TIME,
    end_time TIME,
    frequency VARCHAR(50),
    days VARCHAR(50)[],
    mode VARCHAR(50)
);

-- Table for Internal Phases of a Process
CREATE TABLE internal_phases (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(255) NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phase_order INTEGER NOT NULL
);

-- Table for Fields within an Internal Phase
CREATE TABLE phase_fields (
    id SERIAL PRIMARY KEY,
    phase_id INTEGER NOT NULL REFERENCES internal_phases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    field_order INTEGER NOT NULL
);

-- Table for Process Dependencies (Child Processes)
CREATE TABLE process_dependencies (
    parent_process_id VARCHAR(255) NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    child_process_id VARCHAR(255) NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
    dependency BOOLEAN DEFAULT true,
    PRIMARY KEY (parent_process_id, child_process_id)
);

-- Table for Group-based Page Permissions
-- Table for Role-based CRUD Permissions
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource VARCHAR(255) NOT NULL,
    "create" BOOLEAN DEFAULT false,
    "read" BOOLEAN DEFAULT false,
    "update" BOOLEAN DEFAULT false,
    "delete" BOOLEAN DEFAULT false,
    pages TEXT[] DEFAULT '{}',
    UNIQUE (role_id, resource)
);

-- Table for Registrations
CREATE TABLE registrations (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(255) NOT NULL REFERENCES processes(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    phase VARCHAR(255) NOT NULL DEFAULT 'default',
    "values" JSONB,
    "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Escalations
-- Table for Escalation Rules (defines what to do when a process fails)
CREATE TABLE escalation_rules (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    process_id VARCHAR(255) NOT NULL,
    config JSONB
);

-- Table for Escalation Events (logs when an escalation occurs)
CREATE TABLE escalation_events (
    id SERIAL PRIMARY KEY,
    process_id VARCHAR(255) NOT NULL REFERENCES processes(id),
    company_id INTEGER NOT NULL REFERENCES companies(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for Maintenance Status
CREATE TABLE maintenance_status (
    page VARCHAR(255) PRIMARY KEY,
    is_under_maintenance BOOLEAN DEFAULT false
);

-- Table for Global Messages
CREATE TABLE global_messages (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);