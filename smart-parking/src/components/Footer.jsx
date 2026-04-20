export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="footer-name">SmartPark IoT</span>
          <span className="footer-tagline">
            Intelligent Parking Management for Smart Cities
          </span>
        </div>
       
        <div className="footer-copy">
          © {new Date().getFullYear()} Smart Parking Management System — Built for Smart City Infrastructure
        </div>
      </div>
    </footer>
  );
}
