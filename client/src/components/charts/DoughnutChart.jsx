import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const statusColors = {
    'ok': '#28a745', // success
    'falla': '#dc3545', // danger
    'error': '#ffc107', // warning
    'ambar': '#fd7e14', // orange
    'sin ejecucion': '#6c757d', // secondary
};

const DoughnutChart = ({ summaryData }) => {
    if (!summaryData) {
        return <p>No data to display.</p>;
    }

    const labels = Object.keys(summaryData);
    const dataValues = labels.map(label => summaryData[label].total);
    const backgroundColors = labels.map(label => statusColors[label] || '#000000');

    const chartData = {
        labels: labels,
        datasets: [
            {
                label: '# of Processes',
                data: dataValues,
                backgroundColor: backgroundColors,
                borderColor: '#ffffff',
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Process Status Overview',
                font: {
                    size: 16,
                }
            },
        },
    };

    return (
        <div style={{ position: 'relative', height: '400px' }}>
            <Doughnut data={chartData} options={options} />
        </div>
    );
};

export default DoughnutChart;