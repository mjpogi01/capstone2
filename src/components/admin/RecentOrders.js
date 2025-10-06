import React from 'react';
import './RecentOrders.css';

const RecentOrders = () => {
  const orders = [
    {
      email: 'cusidaniel@gmail.com',
      product: 'GREEN-WHITE "PERSIAN RAGS" JERSEY SET',
      date: '01-15-2025',
      status: 'Completed',
      statusColor: 'blue'
    },
    {
      email: 'yohannssportswear@gmail.com',
      product: 'GREEN-WHITE "PERSIAN RAGS" JERSEY SET',
      date: '01-16-2025',
      status: 'Process',
      statusColor: 'orange'
    },
    {
      email: 'juandelacruz@gmail.com',
      product: 'GREEN-WHITE "PERSIAN RAGS" JERSEY SET',
      date: '01-17-2025',
      status: 'Process',
      statusColor: 'orange'
    },
    {
      email: '123defended@gmail.com',
      product: 'GREEN-WHITE "PERSIAN RAGS" JERSEY SET',
      date: '01-18-2025',
      status: 'Pending',
      statusColor: 'red'
    }
  ];

  return (
    <div className="recent-orders">
      <div className="table-header">
        <h3 className="table-title">Recent Orders</h3>
        <div className="header-actions">
          <button className="search-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </button>
          <button className="filter-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="table-content">
        <div className="table-header-row">
          <div className="header-cell">Users Email</div>
          <div className="header-cell">Product</div>
          <div className="header-cell">Date</div>
          <div className="header-cell">Status</div>
        </div>
        
        {orders.map((order, index) => (
          <div key={index} className="table-row">
            <div className="table-cell email-cell">
              {order.email}
            </div>
            <div className="table-cell product-cell">
              {order.product}
            </div>
            <div className="table-cell date-cell">
              {order.date}
            </div>
            <div className="table-cell status-cell">
              <span className={`status-badge ${order.statusColor}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
