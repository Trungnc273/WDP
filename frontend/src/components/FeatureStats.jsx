import React from 'react';
import './FeatureStats.css';

/**
 * FeatureStats Component
 * Display key features or statistics
 */
function FeatureStats() {
  const stats = [
    {
      icon: '📦',
      value: '10,000+',
      label: 'Sản phẩm',
    },
    {
      icon: '👥',
      value: '5,000+',
      label: 'Người dùng',
    },
    {
      icon: '✅',
      value: '8,000+',
      label: 'Giao dịch',
    },
    {
      icon: '⭐',
      value: '4.8/5',
      label: 'Đánh giá',
    },
  ];

  return (
    <div className="feature-stats">
      <div className="feature-stats__container">
        {stats.map((stat, index) => (
          <div key={index} className="feature-stats__item">
            <div className="feature-stats__icon">{stat.icon}</div>
            <div className="feature-stats__value">{stat.value}</div>
            <div className="feature-stats__label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeatureStats;
