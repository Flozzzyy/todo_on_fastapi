import React from 'react';
import { CheckCircle, Clock, TrendingUp, List } from 'lucide-react';
import './StatsGrid.css';

function StatsGrid({ stats }) {
  const statItems = [
    {
      icon: List,
      label: 'Всего задач',
      value: stats.total,
      color: 'blue'
    },
    {
      icon: Clock,
      label: 'В ожидании',
      value: stats.pending,
      color: 'yellow'
    },
    {
      icon: CheckCircle,
      label: 'Выполнено',
      value: stats.completed,
      color: 'green'
    },
    {
      icon: TrendingUp,
      label: 'Прогресс',
      value: `${stats.percentage}%`,
      color: 'purple'
    }
  ];

  return (
    <div className="stats-grid">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className={`stat-card stat-${item.color}`}>
            <div className="stat-icon">
              <Icon size={24} />
            </div>
            <div className="stat-content">
              <span className="stat-value">{item.value}</span>
              <span className="stat-label">{item.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StatsGrid;
