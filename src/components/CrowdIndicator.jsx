// CrowdIndicator.jsx - Crowd Level Display component
import React from 'react';
import { User, Users, AlertTriangle, HelpCircle } from 'lucide-react';

export const CROWD_CONFIG = {
  low: {
    label: 'Low Crowd',
    shortLabel: 'Low',
    subtitle: 'Plenty of seats available',
    color: '#79a70a',
    bgColor: 'rgba(121, 167, 10, 0.12)',
    borderColor: 'rgba(121, 167, 10, 0.35)',
    textColor: '#5a7c06',
    icon: User,
    badgeClass: 'crowd-badge-low'
  },
  moderate: {
    label: 'Moderate Crowd',
    shortLabel: 'Moderate',
    subtitle: 'Some seats & standing room',
    color: '#f39c12',
    bgColor: 'rgba(243, 156, 18, 0.12)',
    borderColor: 'rgba(243, 156, 18, 0.35)',
    textColor: '#d35400',
    icon: Users,
    badgeClass: 'crowd-badge-moderate'
  },
  high: {
    label: 'Heavy Crowd',
    shortLabel: 'High',
    subtitle: 'Packed • Standing room only',
    color: '#e04f67',
    bgColor: 'rgba(224, 79, 103, 0.12)',
    borderColor: 'rgba(224, 79, 103, 0.35)',
    textColor: '#c93b53',
    icon: AlertTriangle,
    badgeClass: 'crowd-badge-high'
  },
  unavailable: {
    label: 'Crowd Info Unavailable',
    shortLabel: 'No Data',
    subtitle: 'Sensor telemetry connecting...',
    color: '#999999',
    bgColor: 'rgba(153, 153, 153, 0.12)',
    borderColor: 'rgba(153, 153, 153, 0.3)',
    textColor: '#666666',
    icon: HelpCircle,
    badgeClass: 'crowd-badge-unavailable'
  }
};

export default function CrowdIndicator({
  level = 'unavailable',
  occupancyPercent = 0,
  currentPassengers = 0,
  totalCapacity = 50,
  variant = 'badge',
  showOccupancyBar = true,
  className = ''
}) {
  const normalizedLevel = (level || 'unavailable').toLowerCase();
  const config = CROWD_CONFIG[normalizedLevel] || CROWD_CONFIG.unavailable;
  const IconComponent = config.icon;

  if (variant === 'pill') {
    return (
      <span
        className={`crowd-pill ${config.badgeClass} ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          color: config.textColor
        }}
        title={`${config.label} - ${config.subtitle}`}
      >
        <span className="crowd-dot" style={{ backgroundColor: config.color }} />
        <IconComponent size={13} className="crowd-pill-icon" />
        <span className="crowd-pill-text">{config.shortLabel}</span>
        {normalizedLevel !== 'unavailable' && occupancyPercent > 0 && (
          <span className="crowd-pill-percent">({occupancyPercent}%)</span>
        )}
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`crowd-detailed-card ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor
        }}
      >
        <div className="crowd-detailed-header">
          <div className="crowd-header-left">
            <div
              className="crowd-icon-circle"
              style={{ backgroundColor: config.color, color: '#ffffff' }}
            >
              <IconComponent size={18} />
            </div>
            <div>
              <div className="crowd-title" style={{ color: config.textColor }}>
                {config.label}
              </div>
              <div className="crowd-subtitle">{config.subtitle}</div>
            </div>
          </div>
          {normalizedLevel !== 'unavailable' && (
            <div className="crowd-occupancy-num" style={{ color: config.textColor }}>
              {occupancyPercent}% <span>Full</span>
            </div>
          )}
        </div>

        {showOccupancyBar && normalizedLevel !== 'unavailable' && (
          <div className="crowd-meter-wrapper">
            <div className="crowd-meter-track">
              <div
                className="crowd-meter-fill"
                style={{
                  width: `${Math.min(100, occupancyPercent)}%`,
                  backgroundColor: config.color
                }}
              />
            </div>
            <div className="crowd-meter-stats">
              <span>{currentPassengers || Math.round((occupancyPercent / 100) * totalCapacity)} passengers aboard</span>
              <span>Capacity: {totalCapacity} seats</span>
            </div>
          </div>
        )}

        {normalizedLevel === 'unavailable' && (
          <div className="crowd-unavailable-hint">
            Live AI & sensor crowd telemetry is not yet calibrated for this scheduled vehicle.
          </div>
        )}
      </div>
    );
  }

  // Default 'badge' view
  return (
    <div
      className={`crowd-badge ${config.badgeClass} ${className}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        color: config.textColor
      }}
      title={`${config.label}: ${config.subtitle}`}
    >
      <div className="crowd-badge-content">
        <span className="crowd-dot" style={{ backgroundColor: config.color }} />
        <IconComponent size={14} className="crowd-badge-icon" />
        <span className="crowd-badge-label">{config.label}</span>
      </div>
      {normalizedLevel !== 'unavailable' && (
        <span className="crowd-badge-tag">{occupancyPercent}% full</span>
      )}
    </div>
  );
}
