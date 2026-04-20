import { ParkingSlot } from './ParkingSlot';

export function ParkingGrid({ slots }) {
  const rowA = slots.filter(s => s.row === 'A');
  const rowB = slots.filter(s => s.row === 'B');

  const availableCount = slots.filter(s => !s.occupied).length;

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
        {/* Entrance */}
        <div className="lot-entrance">
          <div className="entrance-marker">▼ ENTRANCE</div>
        </div>

        {/* Driving road top */}
        <div className="lot-road">
          <span style={{ color: 'var(--text-muted)', fontSize: '.72rem', letterSpacing: '.1em' }}>
            ◀ ─ ─ ─ DRIVE LANE ─ ─ ─ ▶
          </span>
        </div>

        {/* Slot area */}
        <div className="lot-area">
          {/* Row A */}
          <div className="lot-row">
            <div className="row-label">Row A</div>
            <div className="row-slots">
              {rowA.map(slot => <ParkingSlot key={slot.id} slot={slot} />)}
            </div>
          </div>

          {/* Aisle divider */}
          <div className="lot-aisle">— DRIVING AISLE —</div>

          {/* Row B */}
          <div className="lot-row">
            <div className="row-label">Row B</div>
            <div className="row-slots">
              {rowB.map(slot => <ParkingSlot key={slot.id} slot={slot} />)}
            </div>
          </div>
        </div>

        {/* Exit */}
        <div className="lot-exit">
          <div className="exit-marker">▼ EXIT</div>
        </div>

        {/* Legend */}
        <div className="lot-legend">
          <div className="legend-item">
            <div className="legend-dot available" />
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot occupied" />
            <span>Occupied</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot reserved" />
            <span>Reserved</span>
          </div>
        </div>
      </div>
    </section>
  );
}
