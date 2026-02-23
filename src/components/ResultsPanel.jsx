// components/ResultsPanel.jsx

import React from 'react';
import { Edit2, RotateCcw } from 'lucide-react';

export const ResultsPanel = ({ 
  results, 
  params,
  editMode,
  setEditMode,
  onCoordinateChange,
  onCoordinateBlur,
  onReoptimize,
  isRunning
}) => {
  if (!results) return null;

  // Determine if this is from gradient descent or genetic algorithm
  const isGradientDescent = results.algorithmType === 'gradient';
  
  // Get the score value and label based on algorithm
  const scoreValue = isGradientDescent 
    ? results.best.meanProbability 
    : results.best.fitness;
  
  const scoreLabel = isGradientDescent 
    ? 'Mean Detection Probability' 
    : 'Fitness Score';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="font-santiago text-xs text-navy-600 uppercase tracking-wide mb-3">
            {scoreLabel}
          </div>
          <div className="font-santiago text-4xl text-navy-900">
            {scoreValue ? scoreValue.toFixed(4) : 'N/A'}
          </div>
          {isGradientDescent && (
            <p className="font-bogota text-xs text-navy-500 mt-2">
              Average probability of detecting signals across the region
            </p>
          )}
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="font-santiago text-xs text-navy-600 uppercase tracking-wide mb-3">
            Array Configuration
          </div>
          <div className="font-santiago text-4xl text-navy-900">
            {results.best.xs.length} mics
          </div>
          <p className="font-bogota text-xs text-navy-500 mt-2">
            Optimized using {isGradientDescent ? 'gradient descent' : 'genetic algorithm'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-8 border border-gray-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-santiago text-xl text-navy-900">
            Coordinates (km)
          </h3>
          <div className="flex gap-3">
            {editMode ? (
              <>
                <button
                  onClick={() => setEditMode(false)}
                  className="px-5 py-2.5 bg-white hover:bg-cream-50 text-navy-700 rounded-md transition-colors font-bogota font-medium text-sm border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={onReoptimize}
                  disabled={isRunning}
                  className="px-5 py-2.5 bg-navy-700 hover:bg-navy-800 disabled:bg-gray-300 text-cream-50 rounded-md transition-all font-bogota font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md disabled:shadow-none"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-optimize
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="px-5 py-2.5 bg-navy-600 hover:bg-navy-700 text-cream-50 rounded-md transition-all font-bogota font-medium text-sm flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Edit2 className="w-4 h-4" />
                Edit Coordinates
              </button>
            )}
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-3">
          {results.best.xs.map((x, i) => (
            <div 
              key={i} 
              className="bg-cream-50 rounded-md p-5 flex items-center gap-4 hover:bg-cream-100 transition-all border border-gray-200"
            >
              <div className="w-12 h-12 rounded-md bg-navy-700 flex items-center justify-center font-bogota text-base font-bold flex-shrink-0 text-cream-50">
                {i + 1}
              </div>
              
              {editMode ? (
                <div className="flex gap-4 flex-1">
                  <div className="flex-1">
                    <label className="font-bogota text-xs text-navy-600 mb-2 block">X Coordinate</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={x}
                        onChange={(e) => {
                          const val = e.target.value;

                          // allow empty
                          if (val === "") {
                            onCoordinateChange(i, "x", "");
                            return;
                          }

                          // allow valid decimal typing including trailing dot
                          if (/^-?\d*\.?\d*$/.test(val)) {
                            onCoordinateChange(i, "x", val);
                          }
                        }}

                      onBlur={() => onCoordinateBlur(i, 'x')}
                      className="w-full px-3 py-2.5 font-bogota text-sm font-mono border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="font-bogota text-xs text-navy-600 mb-2 block">Y Coordinate</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={results.best.ys[i]}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^-?\d*\.?\d*$/.test(val)) {
                          onCoordinateChange(i, 'y', val);
                        }
                      }}
                      onBlur={() => onCoordinateBlur(i, 'y')}
                      className="w-full px-3 py-2.5 font-bogota text-sm font-mono border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <span className="font-mono text-lg font-semibold text-navy-800">
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