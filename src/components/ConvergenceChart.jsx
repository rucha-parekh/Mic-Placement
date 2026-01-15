// components/ConvergenceChart.jsx

import React from 'react';

export const ConvergenceChart = ({ results }) => {
  if (!results) return null;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
      <h2 className="text-lg font-semibold mb-4">Convergence History</h2>
      <div className="bg-black rounded-lg p-4">
        <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#3b82f6'}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6'}} />
            </linearGradient>
            <linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.4}} />
              <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0}} />
            </linearGradient>
          </defs>
          <polygon
            points={`0,200 ${results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${200 - Math.min(s, 1) * 180}`
            ).join(' ')} 800,200`}
            fill="url(#ag)"
          />
          <polyline
            points={results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${200 - Math.min(s, 1) * 180}`
            ).join(' ')}
            fill="none"
            stroke="url(#lg)"
            strokeWidth="3"
          />
        </svg>
      </div>
      <div className="mt-3 text-xs text-gray-400 text-center">
        Generation → Fitness progression showing algorithm convergence
      </div>
    </div>
  );
};