import React from 'react';
import './EarningsChart.css';

const EarningsChart = () => {
  const earningsData = [
    { month: 'Jan', value: 15000 },
    { month: 'Feb', value: 18000 },
    { month: 'Mar', value: 22000 },
    { month: 'Apr', value: 19000 },
    { month: 'May', value: 24810 },
    { month: 'Jun', value: 21000 },
    { month: 'Jul', value: 23000 },
    { month: 'Aug', value: 25000 },
    { month: 'Sep', value: 22000 },
    { month: 'Oct', value: 26000 },
    { month: 'Nov', value: 24000 },
    { month: 'Dec', value: 28000 }
  ];

  const maxValue = Math.max(...earningsData.map(d => d.value));
  const minValue = Math.min(...earningsData.map(d => d.value));

  return (
    <div className="earnings-chart">
      <div className="chart-header">
        <h3 className="chart-title">Earnings</h3>
        <div className="chart-controls">
          <select className="year-select">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>
          <select className="location-select">
            <option value="batangas">Batangas City</option>
            <option value="manila">Manila</option>
            <option value="all">All Locations</option>
          </select>
        </div>
      </div>
      
      <div className="chart-container">
        <div className="chart-y-axis">
          {[0, 5, 10, 15, 20, 25, 30, 35].map(value => (
            <div key={value} className="y-axis-label">
              {value}k
            </div>
          ))}
        </div>
        
        <div className="chart-area">
          <svg className="chart-svg" viewBox="0 0 400 200">
            <defs>
              <linearGradient id="earningsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
            
            {/* Area under the curve */}
            <path
              d={`M 0,200 ${earningsData.map((d, i) => {
                const x = (i / (earningsData.length - 1)) * 400;
                const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
                return `L ${x},${y}`;
              }).join(' ')} L 400,200 Z`}
              fill="url(#earningsGradient)"
            />
            
            {/* Line */}
            <path
              d={`M ${earningsData.map((d, i) => {
                const x = (i / (earningsData.length - 1)) * 400;
                const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
                return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
              }).join(' ')}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Data points */}
            {earningsData.map((d, i) => {
              const x = (i / (earningsData.length - 1)) * 400;
              const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="#3b82f6"
                  className="data-point"
                />
              );
            })}
          </svg>
          
          <div className="chart-x-axis">
            {earningsData.map((d, i) => (
              <div key={i} className="x-axis-label">
                {d.month}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsChart;
