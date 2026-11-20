// AlternativeBusCard.jsx - Alternative Bus Recommendation and Comparison Card
import React from 'react';
import { Bus, Clock, Sparkles, ArrowRight } from 'lucide-react';
import CrowdIndicator from './CrowdIndicator';

export default function AlternativeBusCard({
  alternativeBus,
  currentBus,
  onSelectAlternative
}) {
  if (!alternativeBus) return null;

  const isLessCrowded =
    currentBus && (currentBus.occupancyPercent || 50) > (alternativeBus.occupancyPercent || 50);

  const crowdDifference = currentBus
    ? Math.max(0, (currentBus.occupancyPercent || 0) - (alternativeBus.occupancyPercent || 0))
    : 0;

  return (
    <div className={`alternative-bus-card ${alternativeBus.badgeType || 'neutral'}`}>
      {/* Smart Suggestion Header Banner */}
      {alternativeBus.recommendationTag && (
        <div className="alternative-banner">
          <Sparkles size={14} className="banner-icon" />
          <span className="banner-text">{alternativeBus.recommendationTag}</span>
        </div>
      )}

      <div className="alternative-body">
        {/* Top Info */}
        <div className="alternative-top-row">
          <div className="alternative-bus-id">
            <div className="bus-number-badge alt-badge">
              <Bus size={16} />
              <span className="number-text">{alternativeBus.busNumber}</span>
            </div>
            <div className="alternative-route-meta">
              <h4 className="alt-route-name">{alternativeBus.routeName}</h4>
              <span className="alt-category">{alternativeBus.category}</span>
            </div>
          </div>

          <CrowdIndicator
            level={alternativeBus.crowdLevel}
            occupancyPercent={alternativeBus.occupancyPercent}
            variant="pill"
          />
        </div>

        {/* Comparison Highlights Grid */}
        <div className="alternative-comparison-grid">
          {/* Arrival comparison */}
          <div className="comparison-item">
            <span className="comp-label">Arrival Window</span>
            <div className="comp-value">
              <Clock size={14} className="text-blue-500" />
              <span>In {alternativeBus.nextArrivalMins} mins</span>
            </div>
            {currentBus && (
              <span className="comp-subtext">
                {alternativeBus.nextArrivalMins < currentBus.nextArrivalMins
                  ? `${currentBus.nextArrivalMins - alternativeBus.nextArrivalMins}m faster than ${currentBus.busNumber}`
                  : alternativeBus.nextArrivalMins === currentBus.nextArrivalMins
                  ? 'Same arrival time'
                  : `${alternativeBus.nextArrivalMins - currentBus.nextArrivalMins}m later wait`}
              </span>
            )}
          </div>

          {/* Crowd comparison */}
          <div className="comparison-item">
            <span className="comp-label">Crowd Density</span>
            <div className="comp-value">
              <span className="crowd-mini-dot" style={{
                backgroundColor: alternativeBus.crowdLevel === 'low' ? '#10b981' :
                                 alternativeBus.crowdLevel === 'moderate' ? '#f59e0b' : '#ef4444'
              }} />
              <span className="capitalize">{alternativeBus.crowdLevel}</span>
              <span className="occupancy-bracket">({alternativeBus.occupancyPercent}%)</span>
            </div>
            {isLessCrowded && crowdDifference > 0 && (
              <span className="comp-subtext crowd-benefit">
                🎉 {crowdDifference}% fewer passengers
              </span>
            )}
          </div>

          {/* Fare */}
          <div className="comparison-item">
            <span className="comp-label">Fare</span>
            <div className="comp-value">₹{alternativeBus.fare}</div>
            <span className="comp-subtext">Fixed transit rate</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="alternative-actions">
          <button
            type="button"
            className="btn_1 switch-bus-btn"
            onClick={() => onSelectAlternative(alternativeBus)}
          >
            <span>Track This Alternative Bus</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
