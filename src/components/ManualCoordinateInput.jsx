// components/ManualCoordinateInput.jsx

import React from 'react';
import { Plus, Trash2, Play } from 'lucide-react';

export const ManualCoordinateInput = ({ 
  manualCoordinates, 
  setManualCoordinates,
  isRunning,
  onOptimize
}) => {
  const handleCoordinateChange = (index, axis, value) => {
    const newCoords = [...manualCoordinates];
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      newCoords[index] = { ...newCoords[index], [axis]: numValue };
      setManualCoordinates(newCoords);
    }
  };

  const addCoordinate = () => {
    setManualCoordinates([...manualCoordinates, { x: 0, y: 10 }]);
  };

  const removeCoordinate = (index) => {
    setManualCoordinates(manualCoordinates.filter((_, i) => i !== index));
  };

  return (
    <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 shadow-inner">
      <h3 className="text-sm font-bold text-stone-800 mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
        Manual Starting Coordinates
      </h3>
      
      <div className="space-y-2.5 max-h-64 overflow-y-auto mb-4 pr-2">
        {manualCoordinates.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-sm">
            No coordinates yet. Click "Add Point" to start.
          </div>
        ) : (
          manualCoordinates.map((coord, i) => (
            <div key={i} className="flex gap-2.5 items-center bg-white rounded-lg p-3 border border-amber-200 hover:border-amber-400 transition-colors shadow-sm">
              <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full flex-shrink-0 shadow-sm">
                {i + 1}
              </div>
              <div className="flex gap-2 flex-1">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-600 mb-1 block">X (km)</label>
                  <input
                    type="number"
                    value={coord.x}
                    onChange={(e) => handleCoordinateChange(i, 'x', e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-semibold text-stone-600 mb-1 block">Y (km)</label>
                  <input
                    type="number"
                    value={coord.y}
                    onChange={(e) => handleCoordinateChange(i, 'y', e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 text-sm border-2 border-stone-300 rounded-lg focus:border-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <button
                onClick={() => removeCoordinate(i)}
                className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 border border-transparent hover:border-red-200"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={addCoordinate}
          className="flex-1 bg-white hover:bg-stone-50 text-stone-700 border-2 border-stone-300 hover:border-stone-400 rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4" />
          Add Point
        </button>
        <button
          onClick={onOptimize}
          disabled={isRunning || manualCoordinates.length === 0}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-stone-300 disabled:to-stone-400 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          Optimize
        </button>
      </div>
    </div>
  );
};