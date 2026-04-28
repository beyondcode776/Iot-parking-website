import { useState, useEffect, useCallback, useRef } from 'react';

// ── Slot configuration (2 slots) ─────────────────────────────
export const SLOTS_CONFIG = [
  { id: 1, label: 'A1', row: 'A' },
  { id: 2, label: 'A2', row: 'A' },
];

// ── Demo data ────────────────────────────────────────────────
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

// ── Apply serial backend response to slots ───────────────────
function applySerialData(data, prevSlots) {
  return SLOTS_CONFIG.map(({ id, label, row }) => {
    const remote = data.slots?.find(s => s.id === id);
    const prev   = prevSlots.find(s => s.id === id);

    if (!remote || remote.status === 'unknown') {
      return prev ?? { id, label, row, occupied: false, since: Date.now() };
    }

    const occupied = remote.status === 'occupied';
    const flip = prev ? prev.occupied !== occupied : true;
    return { id, label, row, occupied, since: flip ? Date.now() : (prev?.since ?? Date.now()) };
  });
}

// ── Normalise WiFi Arduino JSON ──────────────────────────────
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

// ── Build activity log entries ────────────────────────────────
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

const SERIAL_BACKEND_URL = 'http://localhost:5000/status';

// ── Main hook ─────────────────────────────────────────────────
export function useParkingData({ arduinoIp, port, pollingInterval, demoMode, serialMode }) {
  const [slots,            setSlots]            = useState(() => generateDemoSlots(null));
  const [connectionStatus, setConnectionStatus] = useState('demo');
  const [lastUpdated,      setLastUpdated]      = useState(null);
  const [history,          setHistory]          = useState([]);
  const [activityLog,      setActivityLog]      = useState([]);

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
    const initial = generateDemoSlots(null);
    prevSlotsRef.current = initial;
    setSlots(initial);

    /* ── SERIAL MODE — polls Node.js backend every 1s ──────── */
    if (serialMode) {
      setConnectionStatus('connecting');

      const poll = async () => {
        try {
          const res = await fetch(SERIAL_BACKEND_URL, {
            signal: AbortSignal.timeout(3000),
            cache:  'no-store',
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          if (data.error) {
            console.warn('Serial backend error:', data.error);
            setConnectionStatus('error');
            return;
          }

          const allUnknown = data.slots?.every(s => s.status === 'unknown');
          if (allUnknown) {
            setConnectionStatus('connecting');
            return;
          }

          const next = applySerialData(data, prevSlotsRef.current);
          commit(prevSlotsRef.current, next);
          setConnectionStatus('connected');

        } catch (err) {
          console.warn('Serial backend unreachable:', err.message);
          setConnectionStatus('error');
        }
      };

      poll();
      const id = setInterval(poll, 1000);
      return () => clearInterval(id);
    }

    /* ── DEMO MODE ─────────────────────────────────────────── */
    if (demoMode) {
      setConnectionStatus('demo');
      const id = setInterval(() => {
        const next = generateDemoSlots(prevSlotsRef.current);
        commit(prevSlotsRef.current, next);
      }, 3000);
      return () => clearInterval(id);
    }

    /* ── LIVE WiFi MODE ────────────────────────────────────── */
    setConnectionStatus('connecting');

    const poll = async () => {
      try {
        const url = `http://${arduinoIp}:${port}/status`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(4000),
          cache:  'no-store',
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!Array.isArray(data.slots) || data.slots.length === 0) {
          throw new Error('Unexpected response from Arduino');
        }

        const next = normaliseArduinoData(data, prevSlotsRef.current);
        commit(prevSlotsRef.current, next);
        setConnectionStatus('connected');

      } catch (err) {
        console.warn('Arduino poll failed:', err.message);
        setConnectionStatus(prev => prev === 'connected' ? 'error' : prev);
      }
    };

    poll();
    const id = setInterval(poll, Math.max(pollingInterval || 2000, 500));
    return () => clearInterval(id);

  }, [demoMode, serialMode, arduinoIp, port, pollingInterval, commit]);

  return { slots, connectionStatus, lastUpdated, history, activityLog };
}
