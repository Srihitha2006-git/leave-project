import React from "react";

function Sidebar({ subtitle, links, activeSection, setActiveSection, onLogout }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand-block">
          <div className="brand-logo">HR</div>
          <div>
            <h2>LeaveFlow</h2>
            <p>{subtitle}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <button
              key={link.key}
              className={`nav-button ${activeSection === link.key ? "active" : ""}`}
              onClick={() => setActiveSection(link.key)}
            >
              {link.label}
            </button>
          ))}
        </nav>
      </div>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;