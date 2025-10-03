import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';

ChartJS.register(ArcElement, Tooltip);

const GaugeChart = ({ value, max = 100, label, statusColor = '#28a745' }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    const data = {
        labels: [label || 'Value', 'Remaining'],
        datasets: [
            {
                data: [value, max - value],
                backgroundColor: [statusColor, '#e9ecef'],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
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
            const y = top + height / 2 + 20; // Adjusted for smaller size

            ctx.save();
            ctx.font = 'bold 24px sans-serif'; // Smaller font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#495057';
            ctx.fillText(`${Math.round(percentage)}%`, x, y - 10); // Adjusted position

            ctx.font = '12px sans-serif'; // Smaller font
            ctx.fillStyle = '#6c757d';
            ctx.fillText(label || 'Of Total', x, y + 10); // Adjusted position
            ctx.restore();
        }
    };

    return (
        <div style={{ position: 'relative', height: '120px', margin: 'auto' }}>
            <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
        </div>
    );
};

export default GaugeChart;