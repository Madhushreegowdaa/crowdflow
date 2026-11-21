// RouteStops.jsx - Route Stops Stepper and Timeline Component
import React, { useState } from 'react';
import { CheckCircle2, Clock, MapPin, ChevronDown, ChevronUp, Radio } from 'lucide-react';

export default function RouteStops({
  stops = [],
  currentStopIndex = 0,
  boardStopName = null,
  dropStopName = null,
  onSelectStop = null,
  collapsible = false,
  initialExpanded = true
}) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  if (!stops || stops.length === 0) {
    return <div className="no-stops-message">No stop data registered for this route.</div>;
  }

  const displayedStops = collapsible && !isExpanded ? stops.slice(0, 3) : stops;
  const hasHiddenStops = collapsible && stops.length > 3;

  return (
    <div className="route-stops-container">
      <div className="stops-timeline-header">
        <div className="timeline-title">
          <MapPin size={16} className="text-blue-500" />
          <span>Route Stops Timeline ({stops.length} stops)</span>
        </div>
        {hasHiddenStops && (
          <button
            type="button"
            className="toggle-stops-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>Show Less <ChevronUp size={14} /></>
            ) : (
              <>Show All {stops.length} Stops <ChevronDown size={14} /></>
            )}
          </button>
        )}
      </div>

      <div className="stops-timeline-list">
        {displayedStops.map((stop, index) => {
          const isPassed = stop.passed || index < currentStopIndex;
          const isNext = stop.isNext || index === currentStopIndex;
          const isBoard = boardStopName && stop.name.toLowerCase().includes(boardStopName.toLowerCase());
          const isDrop = dropStopName && stop.name.toLowerCase().includes(dropStopName.toLowerCase());

          let itemStateClass = 'upcoming';
          if (isPassed) itemStateClass = 'passed';
          if (isNext) itemStateClass = 'next-stop';
          if (isBoard) itemStateClass += ' board-stop';
          if (isDrop) itemStateClass += ' drop-stop';

          return (
            <div
              key={stop.id || index}
              className={`timeline-stop-item ${itemStateClass} ${onSelectStop ? 'clickable' : ''}`}
              onClick={() => onSelectStop && onSelectStop(stop)}
            >
              {/* Stepper Node Line */}
              <div className="node-indicator-col">
                <div className={`node-marker ${itemStateClass}`}>
                  {isPassed ? (
                    <CheckCircle2 size={14} className="node-icon passed-icon" />
                  ) : isNext ? (
                    <span className="live-next-ping" />
                  ) : (
                    <span className="node-number">{index + 1}</span>
                  )}
                </div>
                {index < displayedStops.length - 1 && (
                  <div className={`timeline-connector ${isPassed ? 'connector-passed' : 'connector-upcoming'}`} />
                )}
              </div>

              {/* Stop Info Details */}
              <div className="stop-details-col">
                <div className="stop-header-row">
                  <span className="stop-name-text">
                    {stop.name}
                    {isBoard && <span className="stop-role-badge board">Boarding</span>}
                    {isDrop && <span className="stop-role-badge drop">Destination</span>}
                    {isNext && <span className="stop-role-badge next">Next Stop</span>}
                  </span>
                  <div className="stop-time-badge">
                    <Clock size={12} />
                    <span>{stop.estimatedTime || stop.scheduledTime || 'On Schedule'}</span>
                  </div>
                </div>

                {isNext && (
                  <div className="next-stop-callout">
                    <Radio size={12} className="pulse-mini" /> Bus is approaching this stop next
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isExpanded && hasHiddenStops && (
        <div className="collapsed-stops-hint" onClick={() => setIsExpanded(true)}>
          + {stops.length - 3} more stops on this route (Click to expand)
        </div>
      )}
    </div>
  );
}
