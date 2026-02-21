import React from 'react';
import { Plus, Trash2, Play } from 'lucide-react';

export const manualCoordinateInput = ({ 
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
    <div className="p-8 bg-cream-100 rounded-lg border border-gray-200">
      <h3 className="font-santiago text-lg text-navy-900 mb-6">
        Manual Starting Coordinates
      </h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto mb-6">
        {manualCoordinates.length === 0 ? (
          <div className="text-center py-16 text-navy-500 font-bogota text-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            No coordinates yet. Click "Add Point" to start.
          </div>
        ) : (
          manualCoordinates.map((coord, i) => (
            <div key={i} className="flex gap-3 items-center bg-white rounded-md p-4 border border-gray-200 hover:border-navy-400 transition-all">
              <div className="flex items-center justify-center w-10 h-10 bg-navy-700 text-cream-50 font-bogota text-sm font-bold rounded-md flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex gap-3 flex-1">
                <div className="flex-1">
                  <label className="font-bogota text-xs text-navy-600 mb-1.5 block">X (km)</label>
                  <input
                    type="text"
                    inputMode='decimal'
                    value={coord.x}
                    onChange={(e) => handleCoordinateChange(i, 'x', e.target.value)}
                    className="w-full px-3 py-2 font-bogota text-sm border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-bogota text-xs text-navy-600 mb-1.5 block">Y (km)</label>
                  <input
                    type="text"
                    inputMode='decimal'
                    value={coord.y}
                    onChange={(e) => handleCoordinateChange(i, 'y', e.target.value)}
                    step="0.1"
                    className="w-full px-3 py-2 font-bogota text-sm border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
                  />
                </div>
              </div>
              <button
                onClick={() => removeCoordinate(i)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors flex-shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={addCoordinate}
          className="flex-1 bg-white hover:bg-cream-50 text-navy-700 border border-gray-300 hover:border-navy-400 rounded-md py-3 font-bogota text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Point
        </button>
        <button
          onClick={onOptimize}
          disabled={isRunning || manualCoordinates.length === 0}
          className="flex-1 bg-navy-700 hover:bg-navy-800 disabled:bg-gray-300 text-cream-50 rounded-md py-3 font-bogota text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Play className="w-5 h-5" />
          Optimize
        </button>
      </div>
    </div>
  );
};