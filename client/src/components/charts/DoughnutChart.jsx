import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// New colors for criticality levels
const criticalityColors = {
    'Alta': '#dc3545',   // danger
    'Media': '#ffc107',  // warning
    'Baja': '#28a745',    // success
};

const DoughnutChart = ({ statusData }) => {
    if (!statusData) {
        return <p>No data to display.</p>;
    }

    const labels = ['Alta', 'Media', 'Baja'];
    const dataValues = [statusData.Alta, statusData.Media, statusData.Baja];
    const backgroundColors = labels.map(label => criticalityColors[label]);

    const chartData = {
        labels: labels,
        datasets: [
            {
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
            legend: {
                display: true, // Show legend to identify colors
                position: 'bottom',
                labels: {
                    boxWidth: 12,
                    font: {
                        size: 10,
                    }
                }
            },
            title: {
                display: false, // No title needed for the small version
            },
        },
    };

    return (
        <div style={{ position: 'relative', height: '150px', margin: 'auto' }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export default DoughnutChart;