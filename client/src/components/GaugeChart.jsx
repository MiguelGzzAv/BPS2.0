import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const GaugeChart = ({ value, max = 100, title }) => {
    const chartData = {
        labels: ['Value', 'Remaining'],
        datasets: [
            {
                data: [value, max - value],
                backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(230, 230, 230, 0.7)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(230, 230, 230, 1)'],
                borderWidth: 1,
                circumference: 180, // Half circle
                rotation: 270,      // Start from the bottom
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false, // Hide the legend for a cleaner look
            },
            title: {
                display: true,
                text: title,
                font: {
                    size: 16
                }
            },
            tooltip: {
                enabled: false // Disable tooltips as they are not very useful here
            }
        },
        cutout: '70%', // Make it a doughnut
    };

    return (
        <div style={{ position: 'relative', textAlign: 'center' }}>
            <Doughnut data={chartData} options={options} />
            <div
                style={{
                    position: 'absolute',
                    top: '65%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                }}
            >
                {value}%
            </div>
        </div>
    );
};

export default GaugeChart;