// components/ResultsPanel.jsx

import React from 'react';

export const ResultsPanel = ({ results, params }) => {
  if (!results) return null;

  return (
    <>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-600/50 rounded-lg p-4">
          <div className="text-xs text-green-300 mb-1 font-medium">Fitness Score</div>
          <div className="text-2xl font-bold text-green-400">
            {results.best.fitness.toFixed(4)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/50 rounded-lg p-4">
          <div className="text-xs text-blue-300 mb-1 font-medium">Array Configuration</div>
          <div className="text-2xl font-bold text-blue-400">{params.numRecorders} mics</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">
          Coordinates (km)
        </div>
        <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2">
            {results.best.xs.map((x, i) => (
              <div 
                key={i} 
                className="bg-gray-700/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="font-mono text-gray-300">
                  ({x.toFixed(2)}, {results.best.ys[i].toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};