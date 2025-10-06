import React, { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '../api';
import { useAuth } from '../contexts/AuthContext';

const Escalation = () => {
    const [allProcesses, setAllProcesses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allGroups, setAllGroups] = useState([]);
    const [allRules, setAllRules] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { user } = useAuth();
    const companyId = user.role === 'superadmin' ? sessionStorage.getItem('selectedCompanyId') : user.companyId;

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        try {
            if (!companyId) {
                setError('No company selected.');
                setLoading(false);
                return;
            }
            const [processes, users, groups, rules] = await Promise.all([
                fetchWithAuth(`/api/processes?companyId=${companyId}`).then(res => res.json()),
                fetchWithAuth(`/api/users?companyId=${companyId}`).then(res => res.json()),
                fetchWithAuth(`/api/groups?companyId=${companyId}`).then(res => res.json()),
                fetchWithAuth(`/api/escalations?companyId=${companyId}`).then(res => res.json())
            ]);
            setAllProcesses(processes);
            setAllUsers(users);
            setAllGroups(groups);
            setAllRules(rules);
        } catch (err) {
            setError("Error during initial data fetch: " + err.message);
        } finally {
            setLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const generateSelectOptions = (items) => {
        return (
            <>
                <option value="">Choose...</option>
                {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                ))}
            </>
        );
    };

    const UserDetails = ({ userId }) => {
        if (!userId) return null;
        const user = allUsers.find(u => u.id == userId);
        if (!user) return null;
        return (
            <div style={{ fontSize: '0.8em', color: '#6c757d', marginTop: '4px' }}>
                <div>{user.email || ''}</div>
                <div>{user.phone || ''}</div>
            </div>
        );
    };

    const handleToggleEdit = (processId) => {
        setEditingRow(prev => (prev === processId ? null : processId));
    };

    const handleSave = async (processId) => {
        const row = document.querySelector(`tr[data-process-id="${processId}"]`);
        const ruleId = row.dataset.ruleId;
        const groupId = row.querySelector('.group-select').value;
        const levels = Array.from(row.querySelectorAll('.user-select'))
            .map(select => ({
                level: parseInt(select.dataset.level),
                userId: select.value ? parseInt(select.value) : null
            }))
            .filter(level => level.userId);

        const ruleData = {
            id: ruleId ? parseInt(ruleId) : undefined,
            companyId: companyId,
            processId: processId,
            groupId: groupId ? parseInt(groupId) : null,
            levels: levels
        };

        try {
            const response = await fetchWithAuth('/api/escalations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ruleData)
            });

            if (!response.ok) {
                throw new Error('Failed to save rule');
            }

            const savedRule = await response.json();

            setAllRules(prevRules => {
                const existingRuleIndex = prevRules.findIndex(r => r.id === savedRule.id);
                if (existingRuleIndex > -1) {
                    const updatedRules = [...prevRules];
                    updatedRules[existingRuleIndex] = savedRule;
                    return updatedRules;
                } else {
                    return [...prevRules, savedRule];
                }
            });

            setEditingRow(null); // Exit edit mode
        } catch (err) {
            console.error('Error saving rule:', err);
            setError('Error saving rule: ' + err.message);
        }
    };

    const handleUserChange = (e, processId, level) => {
        // This is to force a re-render to show user details, not ideal but works for now
        // A better approach would be to hold the table state in React state
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const maxLevels = Math.max(5, ...allProcesses.map(p => p.escalationLevels || 0));

    return (
        <div className="container mt-4">
            <header className="d-flex justify-content-between align-items-center mb-4">
                <h1>Escalation Rules</h1>
            </header>
            <div className="table-responsive">
                <table className="table table-bordered">
                    <thead className="table-light">
                        <tr>
                            <th>PROCESO</th>
                            <th>GRUPO</th>
                            {Array.from({ length: maxLevels }, (_, i) => i + 1).map(level => (
                                <th key={level}>NIVEL {level}</th>
                            ))}
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {allProcesses.map(proc => {
                            const rule = allRules.find(r => r.processId === proc.id) || {};
                            const isEditing = editingRow === proc.id;
                            const numLevelsForProc = proc.escalationLevels || 5;
                            return (
                                <tr key={proc.id} data-process-id={proc.id} data-rule-id={rule.id || ''}>
                                    <td>{proc.name}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm group-select"
                                            defaultValue={rule.groupId || ''}
                                            disabled={!isEditing}
                                        >
                                            {generateSelectOptions(allGroups)}
                                        </select>
                                    </td>
                                    {Array.from({ length: maxLevels }, (_, i) => i + 1).map(level => {
                                        if (level > numLevelsForProc) {
                                            return <td key={level} />;
                                        }
                                        const userLevel = rule.levels ? rule.levels.find(l => l.level === level) : null;
                                        const userId = userLevel ? userLevel.userId : '';
                                        return (
                                            <td key={level}>
                                                <select
                                                    className="form-select form-select-sm user-select"
                                                    data-level={level}
                                                    defaultValue={userId}
                                                    disabled={!isEditing}
                                                    onChange={(e) => handleUserChange(e, proc.id, level)}
                                                >
                                                    {generateSelectOptions(allUsers)}
                                                </select>
                                                <UserDetails userId={userId} />
                                            </td>
                                        );
                                    })}
                                    <td>
                                        {isEditing ? (
                                            <button className="btn btn-sm btn-success" onClick={() => handleSave(proc.id)}>Guardar</button>
                                        ) : (
                                            <button className="btn btn-sm btn-warning" onClick={() => handleToggleEdit(proc.id)}>Editar</button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Escalation;