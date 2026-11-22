// LiveArrivalTicker.jsx — Real-time arrival countdown for a bus stop
import React, { useEffect, useRef, useState } from 'react';
import { Clock, Radio, MapPin } from 'lucide-react';

/**
 * Converts a "HH:MM AM/PM" scheduled time string into today's Date object.
 */
function parseScheduledTime(timeStr) {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/**
 * Returns mm:ss or "Arriving" string from seconds remaining.
 */
function formatCountdown(seconds) {
  if (seconds <= 0) return 'Arriving now';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export default function LiveArrivalTicker({ bus, targetStopName }) {
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [nextStop, setNextStop] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!bus) return;

    // Find the target stop or fall back to the next unpassed stop
    const stops = bus.stops || [];
    const target = targetStopName
      ? stops.find(s => s.name.toLowerCase().includes(targetStopName.toLowerCase()) && !s.passed)
      : stops.find(s => !s.passed);

    if (!target) {
      setNextStop(null);
      setSecondsLeft(null);
      return;
    }

    setNextStop(target);

    // Try to compute seconds from scheduled time
    const scheduled = parseScheduledTime(target.estimatedTime || target.scheduledTime);
    if (scheduled) {
      const now = new Date();
      const diff = Math.floor((scheduled - now) / 1000);
      // If scheduled time is in the past by more than 2 hours, use nextArrivalMins fallback
      if (diff > -7200) {
        setSecondsLeft(Math.max(0, diff));
        setIsLive(true);

        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          setSecondsLeft(prev => {
            if (prev === null) return null;
            return Math.max(0, prev - 1);
          });
        }, 1000);
        return;
      }
    }

    // Fallback: use nextArrivalMins from bus data
    const fallbackSeconds = (bus.nextArrivalMins ?? 5) * 60;
    setSecondsLeft(fallbackSeconds);
    setIsLive(false);

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [bus?.id, bus?.nextArrivalMins, targetStopName]);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  if (!bus || !nextStop) return null;

  const arriving = secondsLeft !== null && secondsLeft <= 0;
  const urgent = secondsLeft !== null && secondsLeft <= 120 && secondsLeft > 0;

  return (
    <div className={`live-arrival-ticker ${arriving ? 'ticker-arriving' : urgent ? 'ticker-urgent' : ''}`}>
      <div className="ticker-left">
        <div className={`ticker-beacon ${isLive ? 'beacon-live' : 'beacon-est'}`}>
          {isLive ? <Radio size={13} /> : <Clock size={13} />}
        </div>
        <div className="ticker-info">
          <span className="ticker-label">
            {isLive ? 'Live ETA' : 'Est. Arrival'}
          </span>
          <span className="ticker-stop">
            <MapPin size={11} />
            {nextStop.name}
          </span>
        </div>
      </div>
      <div className="ticker-countdown">
        {secondsLeft === null ? '—' : formatCountdown(secondsLeft)}
      </div>
    </div>
  );
}
