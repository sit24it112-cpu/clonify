import React from 'react';
import { ScoreZone } from '../types';

interface ScoreBadgeProps {
  score: number;
  zone?: ScoreZone;
  size?: 'sm' | 'md' | 'lg';
  showZoneLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  zone: explicitZone,
  size = 'md',
  showZoneLabel = false
}) => {
  const rounded = Math.round(score);
  
  // Determine zone if not explicitly passed
  let zone: ScoreZone = explicitZone || 'green';
  if (!explicitZone) {
    if (rounded > 75) zone = 'red';
    else if (rounded >= 31) zone = 'yellow';
    else zone = 'green';
  }

  const zoneConfig = {
    green: {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      label: 'Low Similarity',
      bar: 'bg-emerald-500'
    },
    yellow: {
      text: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      label: 'Moderate Similarity',
      bar: 'bg-amber-500'
    },
    red: {
      text: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      label: 'High Similarity',
      bar: 'bg-rose-500'
    }
  }[zone];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3.5 py-1.5'
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`font-mono tabular-nums font-semibold rounded-md border ${zoneConfig.bg} ${zoneConfig.text} ${zoneConfig.border} ${sizeClasses}`}
      >
        {rounded}%
      </span>
      {showZoneLabel && (
        <span className={`text-xs font-medium ${zoneConfig.text}`}>
          {zoneConfig.label}
        </span>
      )}
    </div>
  );
};
