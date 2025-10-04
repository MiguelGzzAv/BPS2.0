import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithAuth } from '../api';
import DoughnutChart from '../components/DoughnutChart';
import GaugeChart from '../components/GaugeChart';
import { toast } from 'react-toastify';

function Dashboard() {
    const { user } = useAuth();
    const [affectedProcesses, setAffectedProcesses] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for chart data
    const [criticalityData, setCriticalityData] = useState([]);
    const [successRate, setSuccessRate] = useState(0);

    const companyId = sessionStorage.getItem('selectedCompanyId');

    useEffect(() => {
        const fetchData = async () => {
            if (!companyId) {
                toast.warn("No company selected.");
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

                setAffectedProcesses(affectedData);

                // Process data for charts
                if (summaryData.summary) {
                    const { summary } = summaryData;

                    // For Doughnut Chart
                    const critData = { 'Alta': 0, 'Media': 0, 'Baja': 0 };
                    Object.values(summary).forEach(status => {
                        critData['Alta'] += status.Alta;
                        critData['Media'] += status.Media;
                        critData['Baja'] += status.Baja;
                    });
                    setCriticalityData([
                        { label: 'High', value: critData['Alta'] },
                        { label: 'Medium', value: critData['Media'] },
                        { label: 'Low', value: critData['Baja'] },
                    ]);

                    // For Gauge Chart
                    const totalProcesses = Object.values(summary).reduce((acc, curr) => acc + curr.total, 0);
                    const okProcesses = summary.OK ? summary.OK.total : 0;
                    const rate = totalProcesses > 0 ? Math.round((okProcesses / totalProcesses) * 100) : 0;
                    setSuccessRate(rate);
                }

            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [companyId, user]);

    const renderAffectedProcesses = () => {
        if (affectedProcesses.length === 0) {
            return <div className="alert alert-info mt-4">No hay procesos afectados por fallas en sus dependencias.</div>;
        }
        return (
            <div className="mt-5">
                <h4>Procesos Afectados por Fallas</h4>
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
                            <small>Estado del hijo: <span className={`badge bg-danger`}>{item.childStatus.toUpperCase()}</span></small>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="text-center mt-5"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    }

    return (
        <div>
            <h1 className="mb-4">Dashboard</h1>

            <div className="row g-4">
                <div className="col-md-6 col-lg-5">
                    <div className="p-3 border rounded h-100">
                        <DoughnutChart data={criticalityData} title="Procesos por Criticidad" />
                    </div>
                </div>
                <div className="col-md-6 col-lg-5">
                    <div className="p-3 border rounded h-100">
                       <GaugeChart value={successRate} title="Tasa de Éxito de Procesos" />
                    </div>
                </div>
            </div>

            {renderAffectedProcesses()}
        </div>
    );
}

export default Dashboard;