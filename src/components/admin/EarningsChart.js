import React, { useState } from 'react';
import './EarningsChart.css';

const EarningsChart = () => {
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const branches = [
    { value: 'all', label: 'All Branches' },
    { value: 'batangas_city', label: 'BATANGAS CITY BRANCH' },
    { value: 'bauan', label: 'BAUAN BRANCH' },
    { value: 'san_pascual', label: 'SAN PASCUAL (MAIN BRANCH)' },
    { value: 'calapan', label: 'CALAPAN BRANCH' },
    { value: 'pinamalayan', label: 'PINAMALAYAN BRANCH' },
    { value: 'muzon', label: 'MUZON BRANCH' },
    { value: 'lemery', label: 'LEMERY BRANCH' },
    { value: 'rosario', label: 'ROSARIO BRANCH' },
    { value: 'calaca', label: 'CALACA BRANCH' }
  ];

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
          <select 
            className="location-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            {branches.map(branch => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="chart-container">
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
              d={`M0,200 ${earningsData.map((d, i) => {
                const x = (i / (earningsData.length - 1)) * 400;
                const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
                return `L${x},${y}`;
              }).join(' ')} L400,200 Z`}
              fill="url(#earningsGradient)"
            />
            
            {/* Line */}
            <path
              d={`M${earningsData.map((d, i) => {
                const x = (i / (earningsData.length - 1)) * 400;
                const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
                return `${i === 0 ? '' : 'L'}${x},${y}`;
              }).join(' ')}`}
              stroke="#3b82f6"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Data points with hover areas */}
            {earningsData.map((d, i) => {
              const x = (i / (earningsData.length - 1)) * 400;
              const y = 200 - ((d.value - minValue) / (maxValue - minValue)) * 180;
              return (
                <g key={i}>
                  {/* Invisible larger circle for easier hover */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="data-point-hover"
                    onMouseEnter={(e) => {
                      const chartArea = e.currentTarget.closest('.chart-area');
                      if (chartArea) {
                        const rect = chartArea.getBoundingClientRect();
                        const svgRect = chartArea.querySelector('.chart-svg').getBoundingClientRect();
                        // Calculate position relative to chart area
                        const relativeX = ((x / 400) * svgRect.width) + svgRect.left - rect.left;
                        const relativeY = ((y / 200) * svgRect.height) + svgRect.top - rect.top;
                        setHoveredPoint({ month: d.month, value: d.value, index: i });
                        setTooltipPosition({
                          x: relativeX,
                          y: relativeY
                        });
                      }
                    }}
                    onMouseMove={(e) => {
                      const chartArea = e.currentTarget.closest('.chart-area');
                      if (chartArea && hoveredPoint?.index === i) {
                        const rect = chartArea.getBoundingClientRect();
                        const svgRect = chartArea.querySelector('.chart-svg').getBoundingClientRect();
                        const relativeX = ((x / 400) * svgRect.width) + svgRect.left - rect.left;
                        const relativeY = ((y / 200) * svgRect.height) + svgRect.top - rect.top;
                        setTooltipPosition({
                          x: relativeX,
                          y: relativeY
                        });
                      }
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Visible data point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={hoveredPoint?.index === i ? "5" : "3"}
                    fill={hoveredPoint?.index === i ? "#1d4ed8" : "#3b82f6"}
                    className="data-point"
                  />
                </g>
              );
            })}
          </svg>
          
          {/* Tooltip */}
          {hoveredPoint && (
            <div 
              className="chart-tooltip"
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
                transform: 'translate(-50%, calc(-100% - 12px))'
              }}
            >
              <div className="tooltip-content">
                <div className="tooltip-month">{hoveredPoint.month}</div>
                <div className="tooltip-value">{formatCurrency(hoveredPoint.value)}</div>
              </div>
            </div>
          )}
          
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
