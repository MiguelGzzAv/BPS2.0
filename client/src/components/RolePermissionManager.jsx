import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';

function RolePermissionManager() {
    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [permissions, setPermissions] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all companies on component mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const response = await fetchWithAuth('/api/companies');
                if (!response.ok) throw new Error('Failed to fetch companies.');
                const data = await response.json();
                setCompanies(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchCompanies();
    }, []);

    // Fetch permissions when a company is selected
    useEffect(() => {
        if (!selectedCompany) {
            setPermissions(null);
            return;
        }

        const fetchPermissions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await fetchWithAuth(`/api/role-permissions?companyId=${selectedCompany}`);
                if (!response.ok) throw new Error('Failed to fetch permissions for this company.');
                const data = await response.json();
                setPermissions(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPermissions();
    }, [selectedCompany]);

    return (
        <div>
            <div className="mb-3">
                <label htmlFor="company-select" className="form-label">Select a Company to Manage</label>
                <select
                    id="company-select"
                    className="form-select"
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                >
                    <option value="">-- Select a Company --</option>
                    {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
            </div>

            {isLoading && <p>Loading permissions...</p>}
            {error && <div className="alert alert-danger">{error}</div>}

            {isLoading && <p>Loading permissions...</p>}
            {error && <div className="alert alert-danger">{error}</div>}

            {permissions && (
                <PermissionEditor
                    initialPermissions={permissions}
                    companyId={selectedCompany}
                />
            )}
        </div>
    );
}

// A canonical list of all possible permissions in the system
const ALL_RESOURCES = {
    users: ['create', 'read', 'update', 'delete'],
    groups: ['create', 'read', 'update', 'delete'],
    processes: ['create', 'read', 'update', 'delete'],
    permissions: ['read', 'update'],
    registrations: ['create', 'read', 'update', 'delete'],
};

function PermissionEditor({ initialPermissions, companyId }) {
    const [permissions, setPermissions] = useState(initialPermissions);
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', text: '' });

    useEffect(() => {
        setPermissions(initialPermissions);
    }, [initialPermissions]);

    const handleCheckboxChange = (role, resource, action) => {
        setPermissions(prev => {
            const newPermissions = JSON.parse(JSON.stringify(prev)); // Deep copy
            if (!newPermissions[role]) newPermissions[role] = {};
            if (!newPermissions[role][resource]) newPermissions[role][resource] = {};
            newPermissions[role][resource][action] = !newPermissions[role][resource][action];
            return newPermissions;
        });
    };

    const handleSaveChanges = async () => {
        try {
            setIsSaving(true);
            setFeedback({ type: '', text: '' });
            const response = await fetchWithAuth('/api/role-permissions', {
                method: 'POST',
                body: { ...permissions, companyId },
            });
            if (!response.ok) throw new Error('Failed to save permissions.');
            setFeedback({ type: 'success', text: 'Permissions saved successfully!' });
        } catch (err) {
            setFeedback({ type: 'danger', text: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const roles = Object.keys(permissions);
    if (roles.length === 0) {
        return <p>No roles found for this company. Permissions cannot be set.</p>
    }

    return (
        <div className="mt-4">
            <div className="accordion" id="rolesAccordion">
                {roles.map(role => (
                    <div className="accordion-item" key={role}>
                        <h2 className="accordion-header" id={`heading-${role}`}>
                            <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${role}`} aria-expanded="false" aria-controls={`collapse-${role}`}>
                                <strong className="text-capitalize">{role}</strong>
                            </button>
                        </h2>
                        <div id={`collapse-${role}`} className="accordion-collapse collapse" aria-labelledby={`heading-${role}`} data-bs-parent="#rolesAccordion">
                            <div className="accordion-body">
                                <table className="table table-sm table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Resource</th>
                                            {Object.values(ALL_RESOURCES).flat().filter((v, i, a) => a.indexOf(v) === i).map(action => (
                                                <th key={action} className="text-center text-capitalize">{action}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(ALL_RESOURCES).map(resource => (
                                            <tr key={resource}>
                                                <td className="text-capitalize fw-bold">{resource}</td>
                                                {Object.values(ALL_RESOURCES).flat().filter((v, i, a) => a.indexOf(v) === i).map(action => (
                                                    <td key={action} className="text-center">
                                                        {ALL_RESOURCES[resource].includes(action) ? (
                                                            <div className="form-check d-flex justify-content-center">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={!!permissions[role]?.[resource]?.[action]}
                                                                    onChange={() => handleCheckboxChange(role, resource, action)}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">N/A</span>
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button className="btn btn-primary mt-3" onClick={handleSaveChanges} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            {feedback.text && (
                <div className={`alert alert-${feedback.type} mt-3`}>
                    {feedback.text}
                </div>
            )}
        </div>
    );
}

export default RolePermissionManager;