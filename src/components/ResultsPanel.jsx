// components/ResultsPanel.jsx

import React from 'react';
import { Edit2, RotateCcw, Save } from 'lucide-react';

export const ResultsPanel = ({ 
  results, 
  params,
  editMode,
  setEditMode,
  onCoordinateChange,
  onReoptimize,
  isRunning
}) => {
  if (!results) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Fitness Score</div>
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {results.best.fitness.toFixed(4)}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">Array Configuration</div>
          </div>
          <div className="text-3xl font-black text-blue-600">
            {results.best.xs.length} mics
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Coordinates (km)
          </h3>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg transition-colors font-semibold text-sm border border-stone-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onReoptimize}
                  disabled={isRunning}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-stone-300 disabled:to-stone-400 text-white rounded-lg transition-all font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-optimize
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-lg transition-all font-semibold text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Edit2 className="w-4 h-4" />
                Edit Coordinates
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto pr-2 space-y-2.5">
          {results.best.xs.map((x, i) => (
            <div 
              key={i} 
              className="bg-gradient-to-r from-stone-50 to-stone-100 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all border-2 border-stone-200 hover:border-blue-300"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm font-black flex-shrink-0 text-white shadow-lg">
                {i + 1}
              </div>
              
              {editMode ? (
                <div className="flex gap-3 flex-1">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">X Coordinate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={x.toFixed(2)}
                      onChange={(e) => onCoordinateChange(i, 'x', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white font-semibold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-bold text-stone-600 mb-1.5 block">Y Coordinate</label>
                    <input
                      type="number"
                      step="0.01"
                      value={results.best.ys[i].toFixed(2)}
                      onChange={(e) => onCoordinateChange(i, 'y', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white font-semibold"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="font-mono text-lg font-bold text-stone-700">
                    ({x.toFixed(2)}, {results.best.ys[i].toFixed(2)})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};