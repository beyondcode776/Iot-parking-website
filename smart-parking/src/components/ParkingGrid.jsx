import { useEffect, useState } from 'react';
import { ParkingSlot } from './ParkingSlot';

export function ParkingGrid({ slots }) {
  const [liveSlots, setLiveSlots] = useState(slots);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5000/status")
        .then(res => res.json())
        .then(data => {
          console.log("GRID DATA:", data);

          if (!data.slots) return;

          setLiveSlots(prev =>
            prev.map((slot, index) => ({
              ...slot,
              occupied: data.slots[index]?.status === "occupied"
            }))
          );
        })
        .catch(err => console.error(err));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const availableCount = liveSlots.slice(0, 1).filter(s => !s.occupied).length;

  return (
    <section className="section-block glass-card" id="parking" style={{ marginBottom: 0 }}>
      <div className="section-header">
        <div className="section-icon">🅿️</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Parking Lot — Live View</div>
          <div className="section-subtitle">
            Real-time slot availability · Top-down layout
          </div>
        </div>
        <span
          className="status-badge"
          style={{
            background: availableCount > 0 ? 'rgba(0,255,136,.1)' : 'rgba(255,71,87,.1)',
            border: `1px solid ${availableCount > 0 ? 'rgba(0,255,136,.3)' : 'rgba(255,71,87,.3)'}`,
            color: availableCount > 0 ? 'var(--clr-available)' : 'var(--clr-occupied)',
          }}
        >
          {availableCount > 0 ? `${availableCount} Free` : 'Full'}
        </span>
      </div>

      <div className="parking-lot">
        <div className="lot-entrance">
          <div className="entrance-marker">▼ ENTRANCE</div>
        </div>

        <div className="lot-road">
          <span style={{ color: 'var(--text-muted)', fontSize: '.72rem', letterSpacing: '.1em' }}>
            ◀ ─ ─ ─ DRIVE LANE ─ ─ ─ ▶
          </span>
        </div>

        <div className="lot-area">
          <div className="lot-row">
            <div className="row-label">Row A</div>
            <div className="row-slots">
              {liveSlots.slice(0, 1).map(slot => (
                <ParkingSlot key={slot.id} slot={slot} />
              ))}
            </div>
          </div>
        </div>

        <div className="lot-exit">
          <div className="exit-marker">▼ EXIT</div>
        </div>

        <div className="lot-legend">
          <div className="legend-item">
            <div className="legend-dot available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot occupied" />
            <span>Occupied</span>
          </div>
        </div>
      </div>
    </section>
  );
}