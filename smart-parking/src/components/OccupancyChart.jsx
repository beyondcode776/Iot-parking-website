import { useMemo } from 'react';

export function OccupancyChart({ history, totalSlots }) {
  const max = totalSlots || 6;

  const chartData = useMemo(() => {
    if (history.length === 0) return [];
    return history.slice(-14).map((h, i) => ({
      pct:   Math.round((h.occupiedCount / max) * 100),
      count: h.occupiedCount,
      time:  new Date(h.timestamp).toLocaleTimeString([], {
               hour: '2-digit', minute: '2-digit', second: '2-digit',
             }),
      index: i,
    }));
  }, [history, max]);

  const avgOccupancy = chartData.length > 0
    ? Math.round(chartData.reduce((s, d) => s + d.pct, 0) / chartData.length)
    : 0;

  const peak = chartData.length > 0
    ? Math.max(...chartData.map(d => d.pct))
    : 0;

  return (
    <section className="section-block glass-card" id="analytics">
      <div className="section-header">
        <div className="section-icon">📈</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Occupancy Analytics</div>
          <div className="section-subtitle">Live history — last {chartData.length} readings</div>
        </div>
        <div className="chart-avg">
          Avg&nbsp;<strong>{avgOccupancy}%</strong>
          &nbsp;&nbsp;Peak&nbsp;<strong style={{ color: peak > 80 ? 'var(--clr-occupied)' : 'var(--clr-accent)' }}>{peak}%</strong>
        </div>
      </div>

      {/* Bar chart */}
      <div className="chart-area">
        {chartData.length === 0 ? (
          <div className="chart-empty">📊 Collecting data…</div>
        ) : (
          <div className="chart-bars">
            {chartData.map((d, i) => (
              <div
                key={i}
                className="chart-bar-wrap"
                title={`${d.time} — ${d.count}/${max} slots (${d.pct}%)`}
              >
                <div className="chart-bar-inner">
                  <div
                    className={`chart-bar ${d.pct > 80 ? 'high' : d.pct > 50 ? 'mid' : 'low'}`}
                    style={{ height: `${Math.max(d.pct, 3)}%` }}
                  >
                    <span className="bar-value">{d.pct}%</span>
                  </div>
                </div>
                <div className="chart-bar-label">{i + 1}</div>
              </div>
            ))}
          </div>
        )}

        {/* Y-axis */}
        <div className="chart-y-axis">
          {[100, 75, 50, 25, 0].map(v => (
            <div key={v} className="y-label">{v}%</div>
          ))}
        </div>
      </div>

      {/* Summary row */}
      <div style={{
        display: 'flex', gap: 24, marginTop: 20,
        paddingTop: 18, borderTop: '1px solid var(--border-subtle)',
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Current', value: chartData.at(-1)?.pct ?? 0, unit: '%', color: 'var(--clr-accent)' },
          { label: 'Average', value: avgOccupancy,                unit: '%', color: 'var(--clr-accent)' },
          { label: 'Peak',    value: peak,                        unit: '%',
            color: peak > 80 ? 'var(--clr-occupied)' : peak > 50 ? 'var(--clr-reserved)' : 'var(--clr-available)' },
          { label: 'Readings', value: chartData.length,           unit: '',  color: 'var(--text-primary)' },
        ].map(stat => (
          <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color, letterSpacing: '-.03em' }}>
              {stat.value}{stat.unit}
            </span>
            <span style={{ fontSize: '.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
