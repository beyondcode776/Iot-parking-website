import { useState } from 'react';

const ARDUINO_FIRMWARE = () => `// Smart Parking — Arduino Serial (2 Slots)
#define IR_SENSOR 4
#define TRIG 9
#define ECHO 10
#define RED 2
#define GREEN 3

long duration;
int distance;

void setup() {
  pinMode(IR_SENSOR, INPUT);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RED, OUTPUT);
  pinMode(GREEN, OUTPUT);

  Serial.begin(9600);
}

void loop() {

  // -------- Ultrasonic --------
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH, 30000); // timeout added
  distance = duration * 0.034 / 2;

  // -------- IR Sensor --------
  int ir = digitalRead(IR_SENSOR);

  // -------- Debug --------
  Serial.print("IR: ");
  Serial.print(ir);
  Serial.print(" | Distance: ");
  Serial.println(distance);

  String status;

  // -------- SMART LOGIC --------
  // IR = main sensor
  // Ultrasonic = support (only if valid reading)

  if (ir == LOW) {
    // IR detects object → occupied
    status = "occupied";

    digitalWrite(RED, HIGH);
    digitalWrite(GREEN, LOW);
  }
  else if (distance > 0 && distance < 20) {
    // fallback if IR fails but ultrasonic detects
    status = "occupied";

    digitalWrite(RED, HIGH);
    digitalWrite(GREEN, LOW);
  }
  else {
    status = "Not Occupied";

    digitalWrite(RED, LOW);
    digitalWrite(GREEN, HIGH);
  }

  // -------- Send to Website --------
  Serial.println(status);

  delay(800);
}
`;

export function ConnectionPanel({
  settings,
  onSettingsChange,
  connectionStatus,
  onTestConnection,
  onSerialToggle,
}) {
  const [localIp,       setLocalIp]       = useState(settings.arduinoIp);
  const [localPort,     setLocalPort]      = useState(settings.port);
  const [localInterval, setLocalInterval]  = useState(settings.pollingInterval);
  const [showCode,      setShowCode]       = useState(false);
  const [copyLabel,     setCopyLabel]      = useState('📋 Copy');

  const handleSave = () => {
    onSettingsChange({
      arduinoIp:       localIp,
      port:            Number(localPort),
      pollingInterval: Number(localInterval),
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(ARDUINO_FIRMWARE());
    setCopyLabel('✅ Copied!');
    setTimeout(() => setCopyLabel('📋 Copy'), 2000);
  };

  const statusLabel = settings.serialMode ? {
    connected:    '✅ Receiving serial data',
    demo:         '🎮 Demo mode',
    error:        '❌ Backend not reachable',
    connecting:   '⏳ Connecting…',
    disconnected: '🔌 Not connected',
  }[connectionStatus] ?? '–' : {
    connected:    '✅ Arduino responding',
    demo:         '🎮 Demo mode',
    error:        '❌ Cannot reach Arduino',
    connecting:   '⏳ Connecting…',
    disconnected: '🔌 Not connected',
  }[connectionStatus] ?? '–';

  return (
    <section className="section-block glass-card" id="settings">
      {/* Header */}
      <div className="section-header">
        <div className="section-icon">⚙️</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Arduino Connection</div>
          <div className="section-subtitle">Configure hardware connection</div>
        </div>
        <span className={`status-badge ${connectionStatus}`}>
          <span className="status-dot" />
          {connectionStatus === 'connected'   ? 'Connected'
         : connectionStatus === 'demo'        ? 'Demo Mode'
         : connectionStatus === 'connecting'   ? 'Connecting…'
         : connectionStatus === 'error'        ? 'Error'
         : 'Disconnected'}
        </span>
      </div>

      {/* Status bar */}
      <div className="arduino-info">
        <span>ℹ️</span>
        <span>{statusLabel}</span>
      </div>

      {/* Serial Mode Toggle */}
      <div style={{
        marginTop: 16,
        padding: '14px 18px',
        background: settings.serialMode ? 'rgba(0,255,136,.06)' : 'rgba(255,255,255,.03)',
        border: `1px solid ${settings.serialMode ? 'rgba(0,255,136,.25)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--r-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            🔌 USB Serial Mode
          </div>
          <div style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Run <code style={{ color: 'var(--clr-accent)' }}>node backend/server.js</code> first
          </div>
        </div>
        <button
          id="btn-serial-toggle"
          className={`btn ${settings.serialMode ? 'btn-success' : ''}`}
          onClick={onSerialToggle}
          style={{ minWidth: 90, fontSize: '.8rem', padding: '7px 14px' }}
        >
          {settings.serialMode ? '● Active' : 'Enable'}
        </button>
      </div>

      {/* WiFi Settings */}
      {!settings.serialMode && (
        <>
          <div className="settings-grid" style={{ marginTop: 16 }}>
            <div className="form-group">
              <label className="form-label">Arduino IP Address</label>
              <input
                id="arduino-ip"
                className="form-input"
                type="text"
                value={localIp}
                onChange={e => setLocalIp(e.target.value)}
                placeholder="e.g. 192.168.1.100"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input
                id="arduino-port"
                className="form-input"
                type="number"
                value={localPort}
                onChange={e => setLocalPort(e.target.value)}
                placeholder="80"
                min="1" max="65535"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Poll Interval (ms)</label>
              <input
                id="arduino-interval"
                className="form-input"
                type="number"
                value={localInterval}
                onChange={e => setLocalInterval(e.target.value)}
                placeholder="2000"
                min="500" max="30000" step="500"
              />
            </div>
          </div>

          <div className="settings-actions">
            <button id="btn-save-settings" className="btn btn-primary" onClick={handleSave}>
              💾 Save &amp; Apply
            </button>
            <button id="btn-test-conn" className="btn btn-success" onClick={onTestConnection}>
              🔌 Test Connection
            </button>
          </div>
        </>
      )}

      {/* Arduino Code */}
      <div style={{ marginTop: 16 }}>
        <button id="btn-toggle-code" className="btn" onClick={() => setShowCode(v => !v)}>
          📄 {showCode ? 'Hide' : 'Show'} Arduino Code
        </button>
      </div>

      {showCode && (
        <div className="code-block">
          <div className="code-header">
            <span>Arduino Sketch — 2 Slot Serial</span>
            <button className="btn" style={{ padding: '5px 14px', fontSize: '.78rem' }} onClick={handleCopy}>
              {copyLabel}
            </button>
          </div>
          <pre className="code-content">{ARDUINO_FIRMWARE()}</pre>
        </div>
      )}

      {/* Wiring guide */}
      <div style={{
        marginTop: 20,
        padding: '14px 18px',
        background: 'rgba(0,212,255,.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--clr-accent)', marginBottom: 8 }}>
          📌 Wiring
        </div>
        <div style={{ display: 'flex', gap: 32 }}>
          {[
            ['Slot A1', 'Pin 2'],
            ['Slot A2', 'Pin 3'],
          ].map(([slot, pin]) => (
            <div key={slot} style={{ display: 'flex', gap: 12, fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{slot}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-accent)', fontWeight: 600 }}>{pin}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
          IR sensor OUT → Arduino pin · VCC → 5V · GND → GND · LOW = vehicle detected
        </p>
      </div>
    </section>
  );
}
