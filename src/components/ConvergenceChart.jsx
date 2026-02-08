import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ConvergenceChart = ({ results }) => {
  if (!results) return null;

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200">
      <h2 className="font-santiago text-xl mb-8 flex items-center gap-3 text-navy-900">
        <TrendingUp className="w-6 h-6 text-navy-700" />
        Convergence History
      </h2>
      
      <div className="bg-cream-50 rounded-lg p-6 border border-gray-200">
        <svg width="100%" height="220" viewBox="0 0 800 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#334e68'}} />
              <stop offset="100%" style={{stopColor: '#486581'}} />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{stopColor: '#627d98', stopOpacity: 0.15}} />
              <stop offset="100%" style={{stopColor: '#627d98', stopOpacity: 0.02}} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1="220" x2="800" y2="220" stroke="#9fb3c8" strokeWidth="2" />
          <line x1="0" y1="165" x2="800" y2="165" stroke="#d9e2ec" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="110" x2="800" y2="110" stroke="#d9e2ec" strokeWidth="1" strokeDasharray="4,4" />
          <line x1="0" y1="55" x2="800" y2="55" stroke="#d9e2ec" strokeWidth="1" strokeDasharray="4,4" />
          
          {/* Area fill */}
          <polygon
            points={`0,220 ${results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${220 - Math.min(s, 1) * 200}`
            ).join(' ')} 800,220`}
            fill="url(#areaGradient)"
          />
          
          {/* Line */}
          <polyline
            points={results.scores.map((s, i) => 
              `${(i / (results.scores.length - 1)) * 800},${220 - Math.min(s, 1) * 200}`
            ).join(' ')}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* End point marker */}
          <circle
            cx={800}
            cy={220 - Math.min(results.scores[results.scores.length - 1], 1) * 200}
            r="5"
            fill="#334e68"
            stroke="#fef9ed"
            strokeWidth="2"
          />
        </svg>
      </div>
      
      <div className="mt-6 flex items-center justify-center gap-2 font-bogota text-sm text-navy-600 bg-cream-50 rounded-md p-4 border border-gray-200">
        <TrendingUp className="w-5 h-5 text-navy-600" />
        <span>Generation → Fitness progression showing algorithm convergence</span>
      </div>
    </div>
  );
};
