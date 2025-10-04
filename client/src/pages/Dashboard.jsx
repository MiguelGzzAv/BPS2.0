import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, DoughnutController);

function Dashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [affectedProcesses, setAffectedProcesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('criticality');

    const companyId = sessionStorage.getItem('selectedCompanyId');

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId) {
                setError("No company selected.");
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const companyQueryParam = user.role === 'superadmin' ? `?companyId=${companyId}` : '';

                const summaryRes = await fetchWithAuth(`/api/dashboard/summary${companyQueryParam}`);
                const affectedRes = await fetchWithAuth(`/api/dashboard/affected-processes${companyQueryParam}`);

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

        fetchData();
    }, [companyId, user]);

    const renderSummaryCards = () => {
        if (!summary) return null;
        return Object.entries(summary).map(([status, data]) => (
            <div key={status} className="col-lg-4 col-md-6 mb-4">
                <div className={`card h-100 border-start border-5 border-${status.replace(/\s+/g, '-')}`}>
                    <div className="card-body text-center">
                        <h5 className="card-title text-uppercase">{status}</h5>
                        <p className="card-text display-4 fw-bold">{data.total}</p>
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between">Alta <span className="badge bg-danger">{data.Alta}</span></li>
                            <li className="list-group-item d-flex justify-content-between">Media <span className="badge bg-warning text-dark">{data.Media}</span></li>
                            <li className="list-group-item d-flex justify-content-between">Baja <span className="badge bg-success">{data.Baja}</span></li>
                        </ul>
                    </div>
                </div>
            </div>
        ));
    };

    const renderAffectedProcesses = () => {
        if (affectedProcesses.length === 0) {
            return <div className="alert alert-info">No hay procesos afectados por fallas en sus dependencias.</div>;
        }
        return (
            <div className="list-group">
                {affectedProcesses.map(item => (
                    <div key={item.parentProcessId + item.failingChildId} className="list-group-item">
                        <div className="d-flex w-100 justify-content-between">
                            <h5 className="mb-1">{item.parentProcessName}</h5>
                            <small>ID: {item.parentProcessId}</small>
                        </div>
                        <p className="mb-1">
                            Afectado por la falla del proceso hijo: <strong>{item.failingChildName}</strong> (ID: {item.failingChildId})
                        </p>
                        <small>Estado del hijo: <span className={`badge bg-${item.childStatus === 'falla' ? 'danger' : 'warning'}`}>{item.childStatus.toUpperCase()}</span></small>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div>
            <h1 className="mb-4">Dashboard</h1>
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'criticality' ? 'active' : ''}`} onClick={() => setActiveTab('criticality')}>Criticidad</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${activeTab === 'affected' ? 'active' : ''}`} onClick={() => setActiveTab('affected')}>Procesos Afectados</button>
                </li>
            </ul>

            <div className="tab-content">
                {activeTab === 'criticality' && (
                    <div className="row g-4">{renderSummaryCards()}</div>
                )}
                {activeTab === 'affected' && (
                    <div>{renderAffectedProcesses()}</div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;