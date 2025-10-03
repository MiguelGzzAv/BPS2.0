import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

const GaugeChart = ({ value, max = 100, label }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    const data = {
        labels: [label || 'Value', 'Remaining'],
        datasets: [
            {
                data: [value, max - value],
                backgroundColor: ['#28a745', '#e9ecef'], // Green for value, light grey for remaining
                borderWidth: 0,
                circumference: 180, // Make it a semi-circle
                rotation: 270, // Start from the bottom
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false },
        },
    };

    const centerTextPlugin = {
        id: 'centerText',
        afterDraw: (chart) => {
            const ctx = chart.ctx;
            const { top, left, width, height } = chart.chartArea;
            const x = left + width / 2;
            const y = top + height / 2 + 30;

            ctx.save();
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#495057';
            ctx.fillText(`${Math.round(percentage)}%`, x, y - 15);

            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#6c757d';
            ctx.fillText(label || 'Completion', x, y + 15);
            ctx.restore();
        }
    };

    return (
        <div style={{ position: 'relative', height: '200px' }}>
            <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
        </div>
    );
};

export default GaugeChart;