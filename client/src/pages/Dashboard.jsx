import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ProcessListModal from '../components/ProcessListModal';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [affectedProcesses, setAffectedProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('criticality');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', processes: [] });
    const [isModalLoading, setIsModalLoading] = useState(false);

    const companyId = sessionStorage.getItem('selectedCompanyId');

    const fetchData = async (date) => {
        if (!companyId) {
            setError("No company selected.");
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const dateQuery = `date=${date.toISOString().split('T')[0]}`;
            const companyQuery = user.role === 'superadmin' ? `companyId=${companyId}` : '';
            const queryString = `?${[dateQuery, companyQuery].filter(Boolean).join('&')}`;

            const [summaryRes, affectedRes] = await Promise.all([
                fetchWithAuth(`/api/dashboard/summary${queryString}`),
                fetchWithAuth(`/api/dashboard/affected-processes${queryString}`)
            ]);

            if (!summaryRes.ok || !affectedRes.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const summaryData = await summaryRes.json();
            const affectedData = await affectedRes.json();

            setSummary(summaryData.summary);
            setAffectedProcesses(affectedData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(selectedDate);
    }, [companyId, user, selectedDate]);

    const handleShowMore = async (status) => {
        setIsModalLoading(true);
        setIsModalOpen(true);
        setModalContent({ title: `All Processes in "${status}"`, processes: [] });

        try {
            const dateQuery = `date=${selectedDate.toISOString().split('T')[0]}`;
            const companyQuery = user.role === 'superadmin' ? `companyId=${companyId}` : '';
            const queryString = `?${[dateQuery, companyQuery].filter(Boolean).join('&')}`;

            const res = await fetchWithAuth(`/api/dashboard/processes-by-status/${status}${queryString}`);
            if (!res.ok) throw new Error('Failed to fetch process list');
            const data = await res.json();
            setModalContent(prev => ({ ...prev, processes: data }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsModalLoading(false);
        }
    };

    const renderSummaryCards = () => {
        if (!summary) return null;
        return Object.entries(summary).map(([status, data]) => {
            const hasProcesses = data.processes && data.processes.length > 0;
            const sanitizedStatusId = status.replace(/\s+/g, '-');
            const borderColorClass = {
                'ok': 'border-success',
                'falla': 'border-danger',
                'error': 'border-warning',
                'ambar': 'border-warning',
                'sin ejecucion': 'border-secondary',
            }[status] || 'border-secondary';

            return (
                <div key={status} className="col-lg-4 col-md-6 mb-4">
                    <div className={`card h-100 border-start border-5 ${borderColorClass}`}>
                        <div className="card-body d-flex flex-column">
                            <div className="text-center">
                                <h5 className="card-title text-uppercase">{status}</h5>
                                <p className="card-text display-4 fw-bold">{data.total}</p>
                                <ul className="list-group list-group-flush mb-3">
                                    <li className="list-group-item d-flex justify-content-between">Alta <span className="badge bg-danger">{data.Alta}</span></li>
                                    <li className="list-group-item d-flex justify-content-between">Media <span className="badge bg-warning text-dark">{data.Media}</span></li>
                                    <li className="list-group-item d-flex justify-content-between">Baja <span className="badge bg-success">{data.Baja}</span></li>
                                </ul>
                            </div>
                            {hasProcesses && (
                                <div className="mt-auto">
                                    <div className="text-center mb-2 d-flex justify-content-center align-items-center gap-2">
                                        <a className="btn btn-outline-secondary btn-sm" data-bs-toggle="collapse" href={`#collapse-${sanitizedStatusId}`}>Top 5 Processes</a>
                                        <button className="btn btn-info btn-sm rounded-circle" onClick={() => handleShowMore(status)} title="Show All">+</button>
                                    </div>
                                    <div className="collapse" id={`collapse-${sanitizedStatusId}`}>
                                        <ul className="list-group">{data.processes.map(p => <li key={p.id} className="list-group-item">{p.name}</li>)}</ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        });
    };

    const renderAffectedProcesses = () => {
        if (affectedProcesses.length === 0) {
            return <div className="alert alert-info">No hay procesos afectados por fallas en sus dependencias.</div>;
        }
        return (
            <div className="list-group">
                {affectedProcesses.map(item => (
                    <div key={item.parentProcessId + item.failingChildId} className="list-group-item">
                        <h5 className="mb-1">{item.parentProcessName}</h5>
                        <p className="mb-1">Affected by failure in: <strong>{item.failingChildName}</strong></p>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;
    if (error) return <div className="alert alert-danger">{error}</div>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <h1 className="mb-0">Dashboard</h1>
                <div>
                    <label htmlFor="dashboard-date" className="form-label fw-bold">Select Date</label>
                    <input type="date" id="dashboard-date" className="form-control" value={selectedDate.toISOString().split('T')[0]} onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00Z'))} />
                </div>
            </div>

            <ul className="nav nav-tabs mb-3">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'criticality' ? 'active' : ''}`} onClick={() => setActiveTab('criticality')}>Criticidad</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'affected' ? 'active' : ''}`} onClick={() => setActiveTab('affected')}>Procesos Afectados</button></li>
            </ul>

            <div className="tab-content">
                {activeTab === 'criticality' && (
                    <div className="row g-4">{renderSummaryCards()}</div>
                )}
                {activeTab === 'affected' && (
                    <div>{renderAffectedProcesses()}</div>
                )}
            </div>

            <ProcessListModal
                show={isModalOpen}
                onHide={() => setIsModalOpen(false)}
                title={modalContent.title}
                processes={modalContent.processes}
                isLoading={isModalLoading}
            />
        </div>
    );
}

export default Dashboard;