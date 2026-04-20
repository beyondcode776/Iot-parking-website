function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)  return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function ParkingSlot({ slot }) {
  const cls      = slot.occupied ? 'occupied' : 'available';
  const duration = slot.since ? formatDuration(Date.now() - slot.since) : null;

  return (
    <div className={`parking-slot glass-card ${cls}`} title={`Slot ${slot.label} — ${cls}`}>
      {/* Header */}
      <div className="slot-header">
        <span className="slot-label">{slot.label}</span>
        <div className={`slot-indicator ${cls}`} />
      </div>

      {/* Visual */}
      <div className="slot-visual">
        {slot.occupied ? (
          <div className="car-icon">
            <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Body */}
              <rect x="4" y="16" width="56" height="13" rx="3" fill="currentColor" opacity=".8"/>
              {/* Cabin */}
              <path d="M16 16 L22 5 L42 5 L48 16Z" fill="currentColor" opacity=".9"/>
              {/* Windshields */}
              <path d="M23 14 L26 7 L38 7 L41 14Z" fill="rgba(0,212,255,0.35)"/>
              {/* Wheels */}
              <circle cx="17" cy="29" r="4" fill="#050810" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="47" cy="29" r="4" fill="#050810" stroke="currentColor" strokeWidth="1.5"/>
              {/* Headlights */}
              <rect x="56" y="19" width="5" height="3" rx="1.5" fill="rgba(255,255,150,.8)"/>
              <rect x="3"  y="19" width="5" height="3" rx="1.5" fill="rgba(255,150,150,.6)"/>
            </svg>
          </div>
        ) : (
          <div className="empty-icon">
            <svg viewBox="0 0 64 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="14" x2="60" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round"/>
              <line x1="4" y1="24" x2="60" y2="24" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 4" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="slot-status">
        <span className={`slot-status-text ${cls}`}>
          {slot.occupied ? 'Occupied' : 'Available'}
        </span>
        {duration && <span className="slot-duration">{duration}</span>}
      </div>
    </div>
  );
}
