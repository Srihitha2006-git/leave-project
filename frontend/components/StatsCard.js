import React from "react";

function StatsCard({ title, value, className = "" }) {
  return (
    <div className={`stat-card ${className}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default StatsCard;