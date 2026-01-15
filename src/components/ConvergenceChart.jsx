// components/ConvergenceChart.jsx

import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ConvergenceChart = ({ results }) => {
  if (!results) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-lg">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-stone-800">
        <div className="p-2.5 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-xl">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        Convergence History
      </h2>
      
      <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-xl p-5 border-2 border-stone-300 shadow-inner">
        <svg width="100%" height="220" viewBox="0 0 800 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#3b82f6'}} />
              <stop offset="50%" style={{stopColor: '#6366f1'}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6'}} />
            </linearGradient>
            <linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.4}} />
              <stop offset="100%" style={{stopColor: '#8b5cf6', stopOpacity: 0.05}} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1="220" x2="800" y2="220" stroke="#d6d3d1" strokeWidth="2" />
          <line x1="0" y1="165" x2="800" y2="165" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="0" y1="110" x2="800" y2="110" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="0" y1="55" x2="800" y2="55" stroke="#e7e5e4" strokeWidth="1" strokeDasharray="5,5" />
          
          {/* Area fill */}
          <polygon
            points={`0,220 ${results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${220 - Math.min(s, 1) * 200}`
            ).join(' ')} 800,220`}
            fill="url(#ag)"
          />
          
          {/* Line */}
          <polyline
            points={results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${220 - Math.min(s, 1) * 200}`
            ).join(' ')}
            fill="none"
            stroke="url(#lg)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End point marker */}
          <circle
            cx={800}
            cy={220 - Math.min(results.scores[results.scores.length - 1], 1) * 200}
            r="6"
            fill="#8b5cf6"
            stroke="white"
            strokeWidth="3"
          />
        </svg>
      </div>
      
      <div className="mt-4 flex items-center justify-center gap-2 text-sm text-stone-600 bg-stone-50 rounded-lg p-3 border border-stone-200">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        <span className="font-semibold">Generation → Fitness progression showing algorithm convergence</span>
      </div>
    </div>
  );
};