import React from 'react';
import './ReplicatedJerseys.css';

const ReplicatedJerseys = () => {
  const pilipinasJerseys = [
    { number: '1', color: 'blue' },
    { number: '34', color: 'white' },
    { number: '8', color: 'red' },
    { number: '2', color: 'blue' },
    { number: '20', color: 'blue' },
    { number: '18', color: 'white' },
    { number: '11', color: 'blue-yellow-red' },
    { number: '9', color: 'red' }
  ];

  return (
    <section className="replicated-jerseys">
      <div className="container">
        <h2 className="section-title">REPLICATED DESIGN JERSEYS</h2>
        <div className="jerseys-grid">
          {pilipinasJerseys.map((jersey, index) => (
            <div key={index} className={`jersey-item ${jersey.color}`}>
              <div className="jersey-number">{jersey.number}</div>
              <div className="jersey-brand">PILIPINAS</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReplicatedJerseys; 