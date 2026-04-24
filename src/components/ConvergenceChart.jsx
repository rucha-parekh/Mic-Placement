import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ConvergenceChart = ({ results }) => {
  if (!results || !results.scores || results.scores.length === 0) return null;

  const scores = results.scores;
  const isHybrid = results.algorithmType === 'hybrid' && results.gaPhaseLength != null;

  const boundaryX = isHybrid
    ? (results.gaPhaseLength / (scores.length - 1)) * 800
    : null;

  // Both GA and GD now emit meanProbability, so use actual data range
  // with a small pad so the line doesn't touch the edges
  const dataMin = Math.min(...scores);
  const dataMax = Math.max(...scores);
  const pad = (dataMax - dataMin) * 0.08 || 0.01;
  const yMin = Math.max(0, dataMin - pad);
  const yMax = Math.min(1, dataMax + pad);
  const yRange = yMax - yMin || 0.01;

  const toSvgY = (v) => 200 - ((v - yMin) / yRange) * 190; // 10px top pad, 10px bottom pad

  // 4 evenly spaced y-axis ticks
  const yTicks = [0, 1, 2, 3].map(i => yMin + (yRange * i) / 3);

  const linePoints = scores
    .map((s, i) => `${(i / (scores.length - 1)) * 760 + 55},${toSvgY(s)}`)
    .join(' ');

  const areaPoints =
    `55,${toSvgY(yMin)} ` + linePoints + ` ${760 + 55},${toSvgY(yMin)}`;

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200">
      <h2 className="font-santiago text-xl mb-2 flex items-center gap-3 text-navy-900">
        <TrendingUp className="w-6 h-6 text-navy-700" />
        Convergence History
      </h2>
      <p className="font-bogota text-xs text-navy-500 mb-6">
        Mean P(≥{results.minUnits ?? 4} units detected) per {results.algorithmType === 'gradient' ? 'step' : 'generation'}
      </p>

      <div className="bg-cream-50 rounded-lg p-4 border border-gray-200">
        <svg width="100%" height="230" viewBox="0 0 860 230" preserveAspectRatio="none">
          <defs>
            <linearGradient id="cgLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#334e68' }} />
              <stop offset="100%" style={{ stopColor: '#486581' }} />
            </linearGradient>
            <linearGradient id="cgAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#627d98', stopOpacity: 0.18 }} />
              <stop offset="100%" style={{ stopColor: '#627d98', stopOpacity: 0.02 }} />
            </linearGradient>
          </defs>

          {/* Y-axis grid lines + labels */}
          {yTicks.map((t, i) => (
            <g key={i}>
              <line
                x1="55" y1={toSvgY(t)} x2="815" y2={toSvgY(t)}
                stroke={i === 0 ? '#9fb3c8' : '#d9e2ec'}
                strokeWidth={i === 0 ? 1.5 : 1}
                strokeDasharray={i === 0 ? 'none' : '4,4'}
              />
              <text
                x="50" y={toSvgY(t) + 4}
                textAnchor="end" fontSize="9" fill="#9fb3c8" fontFamily="monospace"
              >
                {t.toFixed(3)}
              </text>
            </g>
          ))}

          {/* Hybrid: shade GA region */}
          {isHybrid && boundaryX != null && (
            <rect
              x="55" y="5"
              width={boundaryX}
              height={toSvgY(yMin) - 5}
              fill="#334e68" fillOpacity="0.05"
            />
          )}

          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#cgAreaGrad)" />

          {/* Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="url(#cgLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hybrid phase boundary */}
          {isHybrid && boundaryX != null && (
            <>
              <line
                x1={55 + boundaryX} y1="5"
                x2={55 + boundaryX} y2={toSvgY(yMin)}
                stroke="#486581" strokeWidth="1.5" strokeDasharray="5,3"
              />
              <text
                x={55 + boundaryX / 2} y="16"
                textAnchor="middle" fontSize="10" fill="#486581" fontFamily="sans-serif"
              >
                GA
              </text>
              <text
                x={55 + boundaryX + (760 - boundaryX) / 2} y="16"
                textAnchor="middle" fontSize="10" fill="#486581" fontFamily="sans-serif"
              >
                GD
              </text>
            </>
          )}

          {/* End-point dot */}
          <circle
            cx={815}
            cy={toSvgY(scores[scores.length - 1])}
            r="5"
            fill="#334e68"
            stroke="#fef9ed"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 font-bogota text-xs text-navy-600 bg-cream-50 rounded-md px-4 py-3 border border-gray-200">
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-navy-500" />
          {isHybrid
            ? 'Both phases plot mean probability — the chart is continuous at the GA→GD boundary'
            : results.algorithmType === 'gradient'
              ? 'Mean detection probability per optimisation step'
              : 'Mean detection probability of best individual per generation'}
        </span>
        <span className="font-mono text-navy-500">
          final: {scores[scores.length - 1].toFixed(4)}
        </span>
      </div>
    </div>
  );
};