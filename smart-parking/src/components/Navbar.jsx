export function Navbar({ demoMode, onDemoToggle, connectionStatus }) {
  const statusMap = {
    connected:    { label: 'Connected',     cls: 'connected' },
    demo:         { label: 'Demo Mode',     cls: 'demo' },
    error:        { label: 'Conn. Error',   cls: 'error' },
    connecting:   { label: 'Connecting…',   cls: 'connecting' },
    disconnected: { label: 'Disconnected',  cls: 'error' },
  };
  const { label, cls } = statusMap[connectionStatus] ?? statusMap.disconnected;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="10" fill="rgba(0,212,255,0.1)" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5"/>
              <text x="24" y="32" textAnchor="middle" fill="#00d4ff"
                fontFamily="Space Grotesk, sans-serif" fontWeight="800" fontSize="22">P</text>
              <circle cx="37" cy="11" r="5" fill="#00ff88"/>
              <circle cx="37" cy="11" r="3" fill="#04111d"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">SmartPark</span>
            <span className="brand-tag">IoT Dashboard</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="navbar-links">
          <a href="#dashboard" className="nav-link active">Dashboard</a>
          <a href="#parking"   className="nav-link">Parking</a>
          <a href="#analytics" className="nav-link">Analytics</a>
          <a href="#settings"  className="nav-link">Settings</a>
        </nav>

        {/* Right side */}
        <div className="navbar-actions">
          <span className={`status-badge ${cls}`}>
            <span className="status-dot" />
            {label}
          </span>

          <div className="toggle-wrap" onClick={onDemoToggle} title="Toggle demo mode" role="button">
            <div className={`toggle ${demoMode ? 'on' : ''}`} />
            <span className="toggle-label">Demo</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
