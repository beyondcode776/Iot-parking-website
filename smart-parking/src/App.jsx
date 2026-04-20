import { useState, useCallback } from 'react';
import './index.css';

import { Navbar }          from './components/Navbar';
import { HeroStats }       from './components/HeroStats';
import { ParkingGrid }     from './components/ParkingGrid';
import { LiveFeed }        from './components/LiveFeed';
import { OccupancyChart }  from './components/OccupancyChart';
import { ConnectionPanel } from './components/ConnectionPanel';
import { Footer }          from './components/Footer';
import { useParkingData }  from './hooks/useParkingData';

// ── Default connection settings ────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  arduinoIp:       '192.168.1.100',
  port:            80,
  pollingInterval: 2000,
  demoMode:        true,          // start in demo mode — safe default
};

export default function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const { slots, connectionStatus, lastUpdated, history, activityLog } =
    useParkingData(settings);

  // Toggle demo mode
  const handleDemoToggle = useCallback(() => {
    setSettings(s => ({ ...s, demoMode: !s.demoMode }));
  }, []);

  // Save connection settings from panel
  const handleSettingsChange = useCallback(updates => {
    setSettings(s => ({ ...s, ...updates }));
  }, []);

  // Live test connection — pings the Arduino and gives instant feedback
  const handleTestConnection = useCallback(async () => {
    const url = `http://${settings.arduinoIp}:${settings.port}/status`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        alert(`✅ Connection successful!\n\nArduino at ${settings.arduinoIp} is responding.\nSwitching to live mode…`);
        setSettings(s => ({ ...s, demoMode: false }));
      } else {
        alert(`⚠️ Arduino responded with status ${res.status}.\n\nCheck the firmware code below.`);
      }
    } catch (err) {
      alert(
        `❌ Cannot reach Arduino.\n\nError: ${err.message}\n\n` +
        `Please check:\n` +
        `  1. Arduino is powered on and running the firmware\n` +
        `  2. Both devices are on the same WiFi network\n` +
        `  3. IP address is correct (${settings.arduinoIp})\n` +
        `  4. Port is correct (${settings.port})\n\n` +
        `Tip: Open the Serial Monitor in Arduino IDE to see the assigned IP.`
      );
    }
  }, [settings.arduinoIp, settings.port]);

  return (
    <div className="app">
      {/* 3D Background layers */}
      <div className="stars" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="bg-3d-grid" />
      <div className="bg-3d-overlay" />

      {/* Fixed navigation */}
      <Navbar
        demoMode={settings.demoMode}
        onDemoToggle={handleDemoToggle}
        connectionStatus={connectionStatus}
      />

      <main className="main-content">
        {/* Page hero text */}
        <div className="page-hero">
          <h1 className="page-title">
            Smart Parking <span className="accent">Dashboard</span>
          </h1>
          <p className="page-desc">
            IoT-powered real-time parking management system. Monitor slot availability,
            analyze occupancy trends, and connect your Arduino UNO R4 WiFi in seconds.
          </p>
        </div>

        {/* KPI cards */}
        <HeroStats slots={slots} />

        {/* Parking grid + Live feed side-by-side */}
        <div className="content-grid">
          <ParkingGrid slots={slots} />
          <LiveFeed activityLog={activityLog} lastUpdated={lastUpdated} />
        </div>

        {/* Analytics chart */}
        <OccupancyChart history={history} totalSlots={slots.length} />

        {/* Arduino connection settings */}
        <ConnectionPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          connectionStatus={connectionStatus}
          onTestConnection={handleTestConnection}
        />
      </main>

      <Footer />
    </div>
  );
}
