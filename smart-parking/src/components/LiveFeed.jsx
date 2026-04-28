import { useEffect, useRef, useState } from 'react';

export function LiveFeed() {
  const [activityLog, setActivityLog] = useState([]);
  const [lastUpdated, setLastUpdated]  = useState(null);

  // useRef holds latest slot statuses WITHOUT causing stale closures
  const prevSlotsRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch('http://localhost:5000/status')
        .then(res => res.json())
        .then(data => {
          if (!data.slots) return;

          const current = data.slots.map(s => s.status); // ['free','occupied'] etc.
          const prev    = prevSlotsRef.current;

          // Skip first tick — just record baseline
          if (prev.length === 0) {
            prevSlotsRef.current = current;
            return;
          }

          const newEntries = [];

          current.forEach((status, i) => {
            if (status !== prev[i] && status !== 'unknown') {
              newEntries.push({
                id:     Date.now() + i,
                slot:   i + 1,
                action: status === 'occupied' ? 'Vehicle Detected' : 'Slot Cleared',
                type:   status === 'occupied' ? 'occupied' : 'available',
                time:   new Date().toLocaleTimeString(),
              });
            }
          });

          if (newEntries.length > 0) {
            setActivityLog(prev => [...newEntries, ...prev].slice(0, 20));
            setLastUpdated(new Date());
          }

          // Always update ref so next tick compares fresh values
          prevSlotsRef.current = current;
        })
        .catch(err => console.error('LiveFeed fetch error:', err));
    }, 1000);

    return () => clearInterval(interval);
  }, []); // ✅ Safe — we use ref, not state, for comparison

  return (
    <section className="section-block glass-card live-feed-card" style={{ marginBottom: 0 }}>
      <div className="section-header">
        <div className="section-icon">📋</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Live Activity Feed</div>
          <div className="section-subtitle">Real-time slot state changes</div>
        </div>
        {lastUpdated && (
          <div className="last-updated">{lastUpdated.toLocaleTimeString()}</div>
        )}
      </div>

      <div className="feed-list">
        {activityLog.length === 0 ? (
          <div className="feed-empty">
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <span>Waiting for activity…</span>
            <span style={{ fontSize: '.75rem' }}>Slot state changes will appear here</span>
          </div>
        ) : (
          activityLog.map(entry => (
            <div key={entry.id} className={`feed-entry ${entry.type}`}>
              <div className={`feed-dot ${entry.type}`} />
              <div className="feed-content">
                <span className="feed-slot">Slot {entry.slot}</span>
                <span className="feed-action">{entry.action}</span>
              </div>
              <div className="feed-time">{entry.time}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}