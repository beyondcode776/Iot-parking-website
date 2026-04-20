export function LiveFeed({ activityLog, lastUpdated }) {
  return (
    <section className="section-block glass-card live-feed-card" style={{ marginBottom: 0 }}>
      <div className="section-header">
        <div className="section-icon">📋</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Live Activity Feed</div>
          <div className="section-subtitle">Real-time slot state changes</div>
        </div>
        {lastUpdated && (
          <div className="last-updated">
            {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="feed-list">
        {activityLog.length === 0 ? (
          <div className="feed-empty">
            <span style={{ fontSize: '2rem' }}>⏳</span>
            <span>Waiting for activity…</span>
            <span style={{ fontSize: '.75rem' }}>
              Slot state changes will appear here
            </span>
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
