'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface InteractiveMetricProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple';
  icon?: React.ReactNode;
  description?: string;
  details?: { label: string; value: string }[];
}

export function InteractiveMetric({
  label,
  value,
  trend,
  trendValue,
  color = 'green',
  icon,
  description,
  details,
}: InteractiveMetricProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const colorClasses = {
    green: {
      border: 'border-green-500/30 hover:border-green-400',
      bg: 'bg-green-900/10 hover:bg-green-900/20',
      text: 'text-green-400',
      glow: 'shadow-green-500/20 hover:shadow-green-500/40',
    },
    red: {
      border: 'border-red-500/30 hover:border-red-400',
      bg: 'bg-red-900/10 hover:bg-red-900/20',
      text: 'text-red-400',
      glow: 'shadow-red-500/20 hover:shadow-red-500/40',
    },
    yellow: {
      border: 'border-yellow-500/30 hover:border-yellow-400',
      bg: 'bg-yellow-900/10 hover:bg-yellow-900/20',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20 hover:shadow-yellow-500/40',
    },
    blue: {
      border: 'border-blue-500/30 hover:border-blue-400',
      bg: 'bg-blue-900/10 hover:bg-blue-900/20',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20 hover:shadow-blue-500/40',
    },
    purple: {
      border: 'border-purple-500/30 hover:border-purple-400',
      bg: 'bg-purple-900/10 hover:bg-purple-900/20',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20 hover:shadow-purple-500/40',
    },
  };

  const classes = colorClasses[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={`relative border-2 ${classes.border} ${classes.bg} rounded-xl p-4 transition-all duration-300 cursor-pointer group shadow-lg ${classes.glow} hover:scale-105`}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        <div className={`absolute w-2 h-2 ${classes.text} opacity-20 rounded-full animate-ping`} style={{top: '20%', left: '30%', animationDuration: '3s'}} />
        <div className={`absolute w-2 h-2 ${classes.text} opacity-20 rounded-full animate-ping`} style={{top: '60%', left: '70%', animationDuration: '4s', animationDelay: '1s'}} />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon && <div className={`${classes.text} opacity-80`}>{icon}</div>}
            <div className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</div>
          </div>

          {description && (
            <Info className={`w-4 h-4 ${classes.text} opacity-40 group-hover:opacity-100 transition-opacity`} />
          )}
        </div>

        {/* Value */}
        <div className={`text-4xl font-bold ${classes.text} mb-2 font-mono glow-text group-hover:scale-110 transition-transform origin-left`}>
          {value}
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-2 mb-2">
            <TrendIcon className={`w-4 h-4 ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`} />
            <span className={`text-sm font-mono ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trendValue || (trend === 'up' ? '+12%' : trend === 'down' ? '-8%' : '0%')}
            </span>
          </div>
        )}

        {/* Description */}
        {description && (
          <div className="text-xs text-gray-500 font-mono mt-2 group-hover:text-gray-400 transition-colors">
            {description}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && details && details.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 space-y-2 animate-slideDown">
            {details.map((detail, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 font-mono">{detail.label}</span>
                <span className={`${classes.text} font-bold font-mono`}>{detail.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Click indicator */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className={`text-xs ${classes.text} font-mono animate-pulse`}>
            CLICK FOR DETAILS
          </div>
        </div>
      </div>

      <style jsx>{`
        .glow-text {
          text-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
