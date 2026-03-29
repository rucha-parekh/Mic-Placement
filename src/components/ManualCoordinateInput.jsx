// components/ManualCoordinateInput.jsx
import React from 'react';
import { Plus, Trash2, BarChart2 } from 'lucide-react';
import { CoordinateGuide } from './CoordinateGuide';

export const ManualCoordinateInput = ({ 
  manualCoordinates, 
  setManualCoordinates,
  isRunning,
  onOptimize,
  manualAlgorithm,
  setManualAlgorithm,
  params,
}) => {
  const handleCoordinateChange = (index, axis, value) => {
    const newCoords = [...manualCoordinates];
    // Allow free typing including minus sign and trailing dot
    if (value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value)) {
      newCoords[index] = { ...newCoords[index], [axis]: value };
      setManualCoordinates(newCoords);
    }
  };

  const handleCoordinateBlur = (index, axis) => {
    const newCoords = [...manualCoordinates];
    const raw = newCoords[index][axis];
    const num = parseFloat(raw);
    newCoords[index] = { ...newCoords[index], [axis]: isNaN(num) ? 0 : num };
    setManualCoordinates(newCoords);
  };

  const addCoordinate = () => {
    setManualCoordinates([...manualCoordinates, { x: 0, y: 10 }]);
  };

  const removeCoordinate = (index) => {
    setManualCoordinates(manualCoordinates.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Coordinate system guide */}
      <CoordinateGuide params={params} />

    <div className="p-8 bg-cream-100 rounded-lg border border-gray-200">
      <h3 className="font-santiago text-lg text-navy-900 mb-6">
        Manual Starting Coordinates
      </h3>

      {/* Algorithm selector */}
      <div className="mb-6">
        <label className="font-bogota text-sm text-navy-900 block mb-2">
          Scoring Method
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setManualAlgorithm('gradient')}
            className={`flex-1 py-2.5 rounded-md font-bogota text-sm font-medium border transition-all ${
              manualAlgorithm === 'gradient'
                ? 'bg-navy-700 text-cream-50 border-navy-700 shadow-sm'
                : 'bg-white text-navy-700 border-gray-300 hover:border-navy-400'
            }`}
          >
            Gradient Descent
          </button>
          <button
            onClick={() => setManualAlgorithm('genetic')}
            className={`flex-1 py-2.5 rounded-md font-bogota text-sm font-medium border transition-all ${
              manualAlgorithm === 'genetic'
                ? 'bg-navy-700 text-cream-50 border-navy-700 shadow-sm'
                : 'bg-white text-navy-700 border-gray-300 hover:border-navy-400'
            }`}
          >
            Genetic
          </button>
        </div>
        <p className="font-bogota text-xs text-navy-500 mt-2">
          Mics will be placed at your coordinates exactly — this only calculates the detection score and visualizes coverage.
        </p>
      </div>
      
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
                    inputMode="decimal"
                    value={coord.x}
                    onChange={(e) => handleCoordinateChange(i, 'x', e.target.value)}
                    onBlur={() => handleCoordinateBlur(i, 'x')}
                    className="w-full px-3 py-2 font-bogota text-sm border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="font-bogota text-xs text-navy-600 mb-1.5 block">Y (km)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={coord.y}
                    onChange={(e) => handleCoordinateChange(i, 'y', e.target.value)}
                    onBlur={() => handleCoordinateBlur(i, 'y')}
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
          <BarChart2 className="w-5 h-5" />
          Visualize &amp; Score
        </button>
      </div>
    </div>
    </div>
  );
};