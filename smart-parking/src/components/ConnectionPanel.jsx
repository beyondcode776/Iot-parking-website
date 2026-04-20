import { useState } from 'react';

const ARDUINO_FIRMWARE = (ip, port) => `// ─── SmartPark — Arduino UNO R4 WiFi Firmware ───────────────────────────────
// Paste into Arduino IDE and upload to your board.
// Requires: WiFiS3 library (built-in for R4 WiFi)
// ─────────────────────────────────────────────────────────────────────────────
#include <WiFiS3.h>

// ── WiFi credentials ─────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ── Sensor pins (IR sensors: LOW = occupied) ─────────────────────
const int SENSOR_PINS[] = { 2, 3, 4, 5, 6, 7 };
const int NUM_SLOTS     = 6;

WiFiServer server(${port});

void setup() {
  Serial.begin(115200);
  while (!Serial) {}

  for (int i = 0; i < NUM_SLOTS; i++) {
    pinMode(SENSOR_PINS[i], INPUT_PULLUP);
  }

  Serial.print("Connecting to WiFi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\\nConnected!");
  Serial.print("Dashboard URL: http://");
  Serial.println(WiFi.localIP());

  server.begin();
}

void loop() {
  WiFiClient client = server.available();
  if (!client) return;

  // Wait for request
  String request = "";
  while (client.connected()) {
    if (client.available()) {
      char c = client.read();
      request += c;
      if (request.endsWith("\\r\\n\\r\\n")) break;
    }
  }

  // Build JSON
  String json = "{\\"slots\\":[";
  for (int i = 0; i < NUM_SLOTS; i++) {
    bool occupied = (digitalRead(SENSOR_PINS[i]) == LOW);
    json += "{\\"id\\":";
    json += String(i + 1);
    json += ",\\"occupied\\":";
    json += occupied ? "true" : "false";
    json += "}";
    if (i < NUM_SLOTS - 1) json += ",";
  }
  json += "],\\"timestamp\\":";
  json += String(millis());
  json += "}";

  // HTTP response with CORS headers (required for browser access)
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Access-Control-Allow-Methods: GET");
  client.println("Connection: close");
  client.println();
  client.println(json);
  client.stop();
}
`;

export function ConnectionPanel({
  settings,
  onSettingsChange,
  connectionStatus,
  onTestConnection,
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
    navigator.clipboard.writeText(ARDUINO_FIRMWARE(localIp, localPort));
    setCopyLabel('✅ Copied!');
    setTimeout(() => setCopyLabel('📋 Copy'), 2000);
  };

  const statusLabel = {
    connected:    '✅ Arduino responding normally',
    demo:         '🎮 Running in demo / simulation mode',
    error:        '❌ Cannot reach Arduino — check IP and firmware',
    connecting:   '⏳ Attempting connection…',
    disconnected: '🔌 Not connected',
  }[connectionStatus] ?? '–';

  return (
    <section className="section-block glass-card" id="settings">
      {/* Header */}
      <div className="section-header">
        <div className="section-icon">⚙️</div>
        <div style={{ flex: 1 }}>
          <div className="section-title">Arduino Connection</div>
          <div className="section-subtitle">Configure your Arduino UNO R4 WiFi</div>
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

      {/* Settings fields */}
      <div className="settings-grid">
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

      {/* Action buttons */}
      <div className="settings-actions">
        <button id="btn-save-settings"  className="btn btn-primary" onClick={handleSave}>
          💾 Save &amp; Apply
        </button>
        <button id="btn-test-conn"      className="btn btn-success" onClick={onTestConnection}>
          🔌 Test Connection
        </button>
        <button id="btn-toggle-code"    className="btn" onClick={() => setShowCode(v => !v)}>
          📄 {showCode ? 'Hide' : 'Show'} Arduino Code
        </button>
      </div>

      {/* Arduino firmware code block */}
      {showCode && (
        <div className="code-block">
          <div className="code-header">
            <span>Arduino UNO R4 WiFi — Firmware (paste into IDE)</span>
            <button className="btn" style={{ padding: '5px 14px', fontSize: '.78rem' }} onClick={handleCopy}>
              {copyLabel}
            </button>
          </div>
          <pre className="code-content">{ARDUINO_FIRMWARE(localIp, localPort)}</pre>
        </div>
      )}

      {/* Wiring guide */}
      <div style={{
        marginTop: 24,
        padding: '18px 20px',
        background: 'rgba(0,212,255,.04)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md)',
      }}>
        <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--clr-accent)', marginBottom: 10 }}>
          📌 Quick-Start Wiring Guide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '8px 24px' }}>
          {[
            ['Slot A1', 'Digital Pin 2'],
            ['Slot A2', 'Digital Pin 3'],
            ['Slot A3', 'Digital Pin 4'],
            ['Slot B1', 'Digital Pin 5'],
            ['Slot B2', 'Digital Pin 6'],
            ['Slot B3', 'Digital Pin 7'],
          ].map(([slot, pin]) => (
            <div key={slot} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{slot}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-accent)', fontWeight: 600 }}>{pin}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '.73rem', color: 'var(--text-muted)', marginTop: 10 }}>
          IR sensor OUT → Arduino pin · VCC → 5 V · GND → GND · LOW signal = vehicle detected
        </p>
      </div>
    </section>
  );
}
