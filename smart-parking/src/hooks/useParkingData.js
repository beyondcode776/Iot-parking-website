import { useState, useEffect, useCallback, useRef } from 'react';

// ── Slot configuration (6 slots, 2 rows) ─────────────────────────────────
export const SLOTS_CONFIG = [
  { id: 1, label: 'A1', row: 'A' },
  { id: 2, label: 'A2', row: 'A' },
  { id: 3, label: 'A3', row: 'A' },
  { id: 4, label: 'B1', row: 'B' },
  { id: 5, label: 'B2', row: 'B' },
  { id: 6, label: 'B3', row: 'B' },
];

// ── Generate realistic demo data (15% flip chance per slot) ──────────────
function generateDemoSlots(prev = null) {
  return SLOTS_CONFIG.map(({ id, label, row }) => {
    if (!prev) {
      return { id, label, row, occupied: Math.random() > 0.45, since: Date.now() };
    }
    const p = prev.find(s => s.id === id);
    const flip = Math.random() < 0.15;
    return {
      id, label, row,
      occupied: flip ? !p.occupied : p.occupied,
      since:    flip ? Date.now()  : p.since,
    };
  });
}

// ── Normalise raw Arduino JSON into our slot shape ────────────────────────
// Arduino sends: { slots: [{ id, occupied }, ...], timestamp }
// We merge with SLOTS_CONFIG so labels/rows are always correct
function normaliseArduinoData(data, prevSlots) {
  return SLOTS_CONFIG.map(({ id, label, row }) => {
    const raw  = data.slots?.find(s => Number(s.id) === id);
    const prev = prevSlots.find(s => s.id === id);
    if (!raw) return prev ?? { id, label, row, occupied: false, since: Date.now() };

    const occupied = Boolean(raw.occupied);
    const flip     = prev ? prev.occupied !== occupied : true;
    return { id, label, row, occupied, since: flip ? Date.now() : (prev?.since ?? Date.now()) };
  });
}

// ── Build activity log entries from slot diff ─────────────────────────────
function buildChanges(prev, next) {
  const changed = [];
  next.forEach(slot => {
    const old = prev.find(s => s.id === slot.id);
    if (old && old.occupied !== slot.occupied) {
      changed.push({
        id:     `${Date.now()}-${slot.id}`,
        slot:   slot.label,
        action: slot.occupied ? 'Vehicle Detected' : 'Slot Cleared',
        time:   new Date().toLocaleTimeString(),
        type:   slot.occupied ? 'enter' : 'exit',
      });
    }
  });
  return changed;
}

// ── Main hook ─────────────────────────────────────────────────────────────
export function useParkingData({ arduinoIp, port, pollingInterval, demoMode }) {
  const [slots,            setSlots]            = useState(() => generateDemoSlots(null));
  const [connectionStatus, setConnectionStatus] = useState('demo');
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [history,          setHistory]          = useState([]);
  const [activityLog,      setActivityLog]      = useState([]);

  // Always keep ref in sync so async callbacks read latest slots
  const prevSlotsRef = useRef(slots);

  const commit = useCallback((prev, next) => {
    const changes = buildChanges(prev, next);
    if (changes.length > 0) {
      setActivityLog(log => [...changes, ...log].slice(0, 30));
    }
    prevSlotsRef.current = next;
    setSlots(next);
    setLastUpdated(new Date());
    setHistory(h => {
      const occupied = next.filter(s => s.occupied).length;
      return [...h, { timestamp: Date.now(), occupiedCount: occupied }].slice(-20);
    });
  }, []);

  useEffect(() => {
    // Always reset to a fresh set of demo slots on mode/settings change
    const initial = generateDemoSlots(null);
    prevSlotsRef.current = initial;
    setSlots(initial);

    /* ── DEMO MODE ─────────────────────────────────────────────────────── */
    if (demoMode) {
      setConnectionStatus('demo');
      const id = setInterval(() => {
        const next = generateDemoSlots(prevSlotsRef.current);
        commit(prevSlotsRef.current, next);
      }, 3000);
      return () => clearInterval(id);
    }

    /* ── LIVE MODE — poll Arduino HTTP server ──────────────────────────── */
    // The Arduino must run the firmware from the Connection Panel.
    // It responds to GET http://<ip>:<port>/status with JSON:
    //   { "slots": [{ "id": 1, "occupied": false }, ...], "timestamp": 12345 }
    // It must include "Access-Control-Allow-Origin: *" header.

    setConnectionStatus('connecting');

    const poll = async () => {
      try {
        const url = `http://${arduinoIp}:${port}/status`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(4000),
          cache:  'no-store',           // always get fresh data
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        // Validate expected shape
        if (!Array.isArray(data.slots) || data.slots.length === 0) {
          throw new Error('Unexpected response shape from Arduino');
        }

        const next = normaliseArduinoData(data, prevSlotsRef.current);
        commit(prevSlotsRef.current, next);
        setConnectionStatus('connected');

      } catch (err) {
        // On error: keep last known slot state — don't blank the UI
        // Just mark as error so the user knows something is wrong
        console.warn('[SmartPark] Arduino poll failed:', err.message);
        setConnectionStatus(prev => prev === 'connected' ? 'error' : prev);
      }
    };

    // First poll immediately, then on interval
    poll();
    const id = setInterval(poll, Math.max(pollingInterval || 2000, 500));
    return () => clearInterval(id);

  }, [demoMode, arduinoIp, port, pollingInterval, commit]);

  return { slots, connectionStatus, lastUpdated, history, activityLog };
}
