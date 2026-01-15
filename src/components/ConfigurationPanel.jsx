// components/ConfigurationPanel.jsx

import React from 'react';
import { Settings, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { SliderControl } from './SliderControl';

export const ConfigurationPanel = ({ 
  params, 
  setParams, 
  showAdvanced, 
  setShowAdvanced,
  useDefaultSemicircle,
  isRunning,
  progress,
  onRunOptimization
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5 text-blue-400" />
        Configuration
      </h2>
      
      <div className="space-y-4">
        <SliderControl 
          label="Microphones" 
          value={params.numRecorders} 
          min={1} 
          max={20} 
          step={1} 
          onChange={(v) => setParams({...params, numRecorders: v})} 
        />
        <SliderControl 
          label="Generations" 
          value={params.generations} 
          min={10} 
          max={500} 
          step={10}
          onChange={(v) => setParams({...params, generations: v})} 
        />
        <SliderControl 
          label="Detection Range (km)" 
          value={params.sd} 
          min={1} 
          max={30} 
          step={1}
          onChange={(v) => setParams({...params, sd: v})} 
        />
        {useDefaultSemicircle && (
          <SliderControl 
            label="Region Radius (km)" 
            value={params.radius} 
            min={5} 
            max={30} 
            step={1}
            onChange={(v) => setParams({...params, radius: v})} 
          />
        )}
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-2"
      >
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        Advanced Parameters
      </button>

      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-4">
          <SliderControl 
            label="Population Size" 
            value={params.popSize} 
            min={10} 
            max={100} 
            step={5}
            onChange={(v) => setParams({...params, popSize: v})} 
          />
          <SliderControl 
            label="Mutation Rate" 
            value={params.mutationRate} 
            min={0} 
            max={1} 
            step={0.05}
            onChange={(v) => setParams({...params, mutationRate: v})} 
          />
          <SliderControl 
            label="Mutation Std Dev" 
            value={params.mutationStd} 
            min={0.1} 
            max={10} 
            step={0.5}
            onChange={(v) => setParams({...params, mutationStd: v})} 
          />
          <SliderControl 
            label="Empty Penalty" 
            value={params.emptyPenaltyFraction} 
            min={0} 
            max={2} 
            step={0.1}
            onChange={(v) => setParams({...params, emptyPenaltyFraction: v})} 
          />
          <SliderControl 
            label="Close Penalty" 
            value={params.closePenaltyFraction} 
            min={0} 
            max={2} 
            step={0.1}
            onChange={(v) => setParams({...params, closePenaltyFraction: v})} 
          />
          <SliderControl 
            label="Min Distance (km)" 
            value={params.minDist} 
            min={0.5} 
            max={10} 
            step={0.5}
            onChange={(v) => setParams({...params, minDist: v})} 
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Alpha Curve Strategy</label>
            <select
              value={params.alphaCurve}
              onChange={(e) => setParams({...params, alphaCurve: e.target.value})}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="linear">Linear (gradual shift)</option>
              <option value="expo">Exponential (rapid shift)</option>
            </select>
          </div>
        </div>
      )}

      <button
        onClick={onRunOptimization}
        disabled={isRunning}
        className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-lg py-3 font-semibold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/50"
      >
        <Play className="w-5 h-5" />
        {isRunning ? `Optimizing ${progress.toFixed(0)}%` : 'Run Optimization'}
      </button>

      {isRunning && (
        <div className="mt-3 bg-gray-700 rounded-full h-2 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
};