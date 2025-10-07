import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../api';
import ProcessRow from '../components/ProcessRow';
import SingleRegistrationModal from '../components/SingleRegistrationModal';
import MultiPhaseRegistrationModal from '../components/MultiPhaseRegistrationModal';

const Monitoring = () => {
    const [masterProcessList, setMasterProcessList] = useState([]);
    const [allRegistrations, setAllRegistrations] = useState([]);
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [sortOrder, setSortOrder] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Modal State
    const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
    const [isMultiPhaseModalOpen, setIsMultiPhaseModalOpen] = useState(false);
    const [currentProcess, setCurrentProcess] = useState(null);

    const fetchAllData = async () => {
        const companyId = sessionStorage.getItem('selectedCompanyId');
        if (!companyId) {
            setError('No company selected.');
            setLoading(false);
            return;
        }
        try {
            // Don't set loading to true on interval refresh
            if (loading) setLoading(true);

            const [processesRes, registrationsRes, usersRes] = await Promise.all([
                fetchWithAuth(`/api/processes?companyId=${companyId}`),
                fetchWithAuth(`/api/registrations?companyId=${companyId}`),
                fetchWithAuth(`/api/users?companyId=${companyId}`)
            ]);

            if (!processesRes.ok || !registrationsRes.ok || !usersRes.ok) {
                throw new Error('Failed to fetch initial monitoring data.');
            }

            const processes = await processesRes.json();
            const registrations = await registrationsRes.json();
            const users = await usersRes.json();

            setMasterProcessList(processes);
            setAllRegistrations(registrations);
            setUserList(users);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch data initially and then set up intervals
        fetchAllData();
        const dataFetchInterval = setInterval(fetchAllData, 60000); // Refresh data every minute
        const timeUpdateInterval = setInterval(() => setCurrentTime(new Date()), 1000); // Update time every second

        return () => {
            clearInterval(dataFetchInterval);
            clearInterval(timeUpdateInterval);
        };
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleRegisterClick = (process) => {
        setCurrentProcess(process);
        if (process.mode === 'Multiple') {
            setIsMultiPhaseModalOpen(true);
        } else {
            setIsSingleModalOpen(true);
        }
    };

    const handleCloseModals = () => {
        setIsSingleModalOpen(false);
        setIsMultiPhaseModalOpen(false);
        setCurrentProcess(null);
    };

    const handleSaveRegistration = async (processId, phase, values) => {
        try {
            const companyId = sessionStorage.getItem('selectedCompanyId');
            const registrationData = { companyId, processId, phase, values, timestamp: new Date().toISOString() };

            const response = await fetchWithAuth('/api/registrations', {
                method: 'POST',
                body: JSON.stringify(registrationData),
            });

            if (!response.ok) {
                throw new Error('Failed to save registration');
            }

            handleCloseModals();
            await fetchAllData(); // Refresh data to show new status
        } catch (err) {
            setError(err.message);
            // Optionally, don't close modal on error so user can retry
        }
    };

    const getDisplayedProcesses = () => {
        let processesToDisplay = [...masterProcessList];
        if (filters.name) {
            processesToDisplay = processesToDisplay.filter(p => p.name.toLowerCase().includes(filters.name.toLowerCase()));
        }
        if (filters.status) {
            processesToDisplay = processesToDisplay.filter(p => p.status === filters.status);
        }
        if (sortOrder) {
            processesToDisplay.sort((a, b) => {
                const timeA = parseInt((a.startTime || '0').replace(':', ''), 10);
                const timeB = parseInt((b.startTime || '0').replace(':', ''), 10);
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            });
        }
        return processesToDisplay;
    };

    if (loading) return <p>Loading initial data...</p>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    const processMap = new Map(masterProcessList.map(p => [p.id, p]));
    const childProcessIds = new Set(masterProcessList.flatMap(p => (p.childProcesses || []).map(child => child.id)));
    const rootProcesses = getDisplayedProcesses().filter(p => !childProcessIds.has(p.id));

    return (
        <>
            <h1 className="mb-4">Process Monitoring</h1>
            <div className="row mb-3 gx-2">
                <div className="col-md-5">
                    <input type="text" name="name" className="form-control" placeholder="Filter by process name..." value={filters.name} onChange={handleFilterChange} />
                </div>
                <div className="col-md-4">
                    <select name="status" className="form-select" value={filters.status} onChange={handleFilterChange}>
                        <option value="">All Statuses</option>
                        <option value="ok">OK</option>
                        <option value="falla">Falla</option>
                        <option value="error">Error</option>
                        <option value="ambar">Ambar</option>
                        <option value="sin ejecucion">Sin Ejecucion</option>
                        <option value="POR INICIAR">Por Iniciar</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <button className="btn btn-outline-secondary w-100" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                        Sort by Time {sortOrder && (sortOrder === 'asc' ? '▲' : '▼')}
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="table-light">
                        <tr>
                            <th>PROCESO</th>
                            <th>INICIO</th>
                            <th>FIN</th>
                            <th>ESTATUS</th>
                            <th>PROGRESO</th>
                            <th>URGENCIA</th>
                            <th>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rootProcesses.length > 0 ? (
                            rootProcesses.map(proc => (
                                <ProcessRow
                                    key={proc.id}
                                    process={proc}
                                    processMap={processMap}
                                    onRegister={handleRegisterClick}
                                    currentTime={currentTime}
                                />
                            ))
                        ) : (
                            <tr><td colSpan="7" className="text-center">No processes found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isSingleModalOpen && (
                <SingleRegistrationModal
                    show={isSingleModalOpen}
                    onHide={handleCloseModals}
                    onSave={handleSaveRegistration}
                    process={currentProcess}
                    userList={userList}
                />
            )}

            {isMultiPhaseModalOpen && (
                <MultiPhaseRegistrationModal
                    show={isMultiPhaseModalOpen}
                    onHide={handleCloseModals}
                    onSave={handleSaveRegistration}
                    process={currentProcess}
                    allRegistrations={allRegistrations}
                    userList={userList}
                />
            )}
        </>
    );
};

export default Monitoring;