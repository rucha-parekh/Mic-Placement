// components/ConfigurationPanel.jsx

import React from 'react';
import { Settings, ChevronDown, ChevronUp, Play, Sliders } from 'lucide-react';
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
    <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-lg hover:shadow-xl transition-shadow">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-stone-800">
        <div className="p-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
          <Settings className="w-5 h-5 text-white" />
        </div>
        Configuration
      </h2>
      
      <div className="space-y-5">
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
        className="w-full mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 transition-colors py-3 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200"
      >
        <Sliders className="w-4 h-4" />
        {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAdvanced && (
        <div className="mt-5 pt-5 border-t-2 border-stone-200 space-y-5 animate-fadeIn">
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
          
          <div className="space-y-2.5">
            <label className="text-sm font-semibold text-stone-700">Alpha Curve Strategy</label>
            <select
              value={params.alphaCurve}
              onChange={(e) => setParams({...params, alphaCurve: e.target.value})}
              className="w-full bg-stone-50 text-stone-900 rounded-xl px-4 py-3 text-sm border-2 border-stone-300 focus:border-blue-500 focus:outline-none font-medium hover:bg-white transition-colors"
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
        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-stone-300 disabled:to-stone-400 disabled:cursor-not-allowed text-white rounded-xl py-4 font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
      >
        <Play className="w-5 h-5" />
        {isRunning ? `Optimizing ${progress.toFixed(0)}%` : 'Run Optimization'}
      </button>

      {isRunning && (
        <div className="mt-4 bg-stone-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div 
            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full transition-all duration-300 rounded-full shadow-lg"
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
};