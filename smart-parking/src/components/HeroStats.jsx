import { useMemo } from 'react';

export function HeroStats({ slots }) {
  const stats = useMemo(() => {
    const total    = slots.length;
    const occupied = slots.filter(s => s.occupied).length;
    const available = total - occupied;
    const rate      = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, rate };
  }, [slots]);

  const cards = [
    {
      id: 'total', icon: '🅿️', label: 'Total Slots',
      value: stats.total, sub: 'Managed spaces', color: 'accent',
    },
    {
      id: 'available', icon: '✅', label: 'Available',
      value: stats.available, sub: 'Ready to park', color: 'available',
    },
    {
      id: 'occupied', icon: '🚗', label: 'Occupied',
      value: stats.occupied, sub: 'Vehicles parked', color: 'occupied',
    },
    {
      id: 'rate', icon: '📊', label: 'Occupancy Rate',
      value: `${stats.rate}%`,
      sub: stats.rate > 80 ? 'High demand' : stats.rate > 50 ? 'Moderate use' : 'Low demand',
      color: stats.rate > 80 ? 'occupied' : stats.rate > 50 ? 'reserved' : 'available',
    },
  ];

  return (
    <section className="hero-stats" id="dashboard">
      {cards.map((card, i) => (
        <div
          key={card.id}
          className={`stat-card glass-card color-${card.color}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <span className="stat-icon">{card.icon}</span>
          <div className="stat-content">
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-sub">{card.sub}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
