import express from 'express';
import cors from 'cors';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

// ── Configuration ─────────────────────────────────────────────
const HTTP_PORT   = process.env.PORT        || 5000;
const SERIAL_PATH = process.env.SERIAL_PORT || 'COM3';
const BAUD_RATE   = Number(process.env.BAUD_RATE) || 9600;

// ── State (2 slots) ───────────────────────────────────────────
let slotStatus = ['unknown', 'unknown'];
let serialError = null;

// ── Helper: normalise any status string Arduino might send ─────
// Arduino sketch sends: "occupied" | "Not Occupied" | "free"
// Server.js was only checking "free" → everything else stayed "unknown"
function normalise(raw) {
  const v = raw.trim().toLowerCase();
  if (v === 'occupied')                    return 'occupied';
  if (v === 'free' || v === 'not occupied') return 'free';  // ← KEY FIX
  return null; // unknown / ignore
}

// ── Serial Setup ──────────────────────────────────────────────
try {
  const port   = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE });
  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

  parser.on('data', (line) => {
    const raw = line.trim();
    console.log('RAW:', raw);

    // Skip Arduino debug lines like "IR: 0 | Distance: 15"
    // These contain a pipe character and are not status lines
    if (raw.includes('|') || raw.includes(':')) {
      console.log('⏭️  Debug line, skipping:', raw);
      return;
    }

    // Format: "occupied,not occupied"  or  "free,occupied"
    if (raw.includes(',')) {
      const parts = raw.split(',');
      const s0 = normalise(parts[0]);
      const s1 = normalise(parts[1] ?? '');
      if (s0) slotStatus[0] = s0;
      if (s1) slotStatus[1] = s1;
      serialError = null;
      console.log(`🅿️  Slot1: ${slotStatus[0]} | Slot2: ${slotStatus[1]}`);
      return;
    }

    // Single value → applies to Slot 1 only
    const s = normalise(raw);
    if (s) {
      slotStatus[0] = s;
      serialError   = null;
      console.log(`🅿️  Slot1: ${slotStatus[0]}`);
    } else {
      console.log('⚠️  Ignored:', raw);
    }
  });

  port.on('open',  ()    => console.log(`✅ Serial connected: ${SERIAL_PATH} @ ${BAUD_RATE}`));
  port.on('error', (err) => { serialError = err.message;       slotStatus = ['unknown','unknown']; console.error('❌ Serial Error:', err.message); });
  port.on('close', ()    => { serialError = 'Port closed';     slotStatus = ['unknown','unknown']; console.warn('⚠️  Serial Port Closed'); });

} catch (err) {
  serialError = err.message;
  console.error('❌ Failed to open serial:', err.message);
}

// ── Express ───────────────────────────────────────────────────
const app = express();
app.use(cors());

app.get('/status', (req, res) => {
  res.json({
    slots: [
      { id: 1, status: slotStatus[0] },
      { id: 2, status: slotStatus[1] },
    ],
    error: serialError,
  });
});

app.get('/', (req, res) => {
  res.json({
    service:    'Smart Parking Backend',
    serialPort: SERIAL_PATH,
    baudRate:   BAUD_RATE,
    slots:      slotStatus,
  });
});

app.listen(HTTP_PORT, () => {
  console.log(`\n🚀 Server running → http://localhost:${HTTP_PORT}`);
  console.log(`   GET /status  returns slot states\n`);
});