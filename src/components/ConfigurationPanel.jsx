import React from 'react';
import { Settings, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { SliderControl } from './SliderControl';
import { ADVANCED_PARAM_DESCRIPTIONS } from '../constants/defaultParams';

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
    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
      <h2 className="font-santiago text-xl mb-8 text-navy-900 flex items-center gap-3">
        <Settings className="w-6 h-6 text-navy-700" />
        Configuration
      </h2>
      
      <div className="space-y-8">
        {/* Optimization Method Selection */}
        <div className="space-y-3">
          <label className="font-santiago text-sm text-navy-900 block">
            Optimization Method
          </label>
          <select
            value={params.optimizationMethod}
            onChange={(e) => setParams({...params, optimizationMethod: e.target.value})}
            className="w-full bg-cream-50 text-navy-900 rounded-md px-4 py-3 font-bogota text-sm border border-gray-300 focus:border-navy-600 focus:ring-2 focus:ring-navy-200 focus:outline-none"
          >
            <option value="genetic">Genetic Algorithm</option>
            <option value="gradient">Gradient Descent</option>
          </select>
          <p className="font-bogota text-xs text-gray-500 mt-2">
            {params.optimizationMethod === 'genetic' 
              ? 'Evolutionary approach exploring multiple solutions simultaneously'
              : 'Mathematical optimization following the steepest improvement direction'}
          </p>
        </div>

        <SliderControl 
          label="Microphones" 
          value={params.numRecorders} 
          min={1} 
          max={20} 
          step={1} 
          onChange={(v) => setParams({...params, numRecorders: v})} 
        />
        
        {params.optimizationMethod === 'genetic' ? (
          <SliderControl 
            label="Generations" 
            value={params.generations} 
            min={10} 
            max={500} 
            step={10}
            onChange={(v) => setParams({...params, generations: v})} 
          />
        ) : (
          <SliderControl 
            label="Optimization Steps" 
            value={params.gradientSteps} 
            min={100} 
            max={2000} 
            step={100}
            onChange={(v) => setParams({...params, gradientSteps: v})} 
          />
        )}
        
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
        className="w-full mt-8 flex items-center justify-center gap-2 font-bogota text-sm text-navy-700 hover:text-navy-900 transition-colors py-3 bg-cream-100 hover:bg-cream-200 rounded-md border border-gray-200"
      >
        {showAdvanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {showAdvanced && (
        <div className="mt-8 pt-8 border-t border-gray-200 space-y-8">
          {params.optimizationMethod === 'genetic' && (
            <>
              <div>
                <SliderControl 
                  label="Population Size" 
                  value={params.popSize} 
                  min={10} 
                  max={100} 
                  step={5}
                  onChange={(v) => setParams({...params, popSize: v})} 
                />
                <p className="font-bogota text-xs text-gray-500 mt-2">
                  {ADVANCED_PARAM_DESCRIPTIONS.popSize}
                </p>
              </div>
              
              <div>
                <SliderControl 
                  label="Mutation Rate" 
                  value={params.mutationRate} 
                  min={0} 
                  max={1} 
                  step={0.05}
                  onChange={(v) => setParams({...params, mutationRate: v})} 
                />
                <p className="font-bogota text-xs text-gray-500 mt-2">
                  {ADVANCED_PARAM_DESCRIPTIONS.mutationRate}
                </p>
              </div>
              
              <div>
                <SliderControl 
                  label="Mutation Std Dev" 
                  value={params.mutationStd} 
                  min={0.1} 
                  max={10} 
                  step={0.5}
                  onChange={(v) => setParams({...params, mutationStd: v})} 
                />
                <p className="font-bogota text-xs text-gray-500 mt-2">
                  {ADVANCED_PARAM_DESCRIPTIONS.mutationStd}
                </p>
              </div>
            </>
          )}
          
          {params.optimizationMethod === 'gradient' && (
            <div>
              <SliderControl 
                label="Learning Rate" 
                value={params.gradientLearningRate} 
                min={0.0001} 
                max={0.01} 
                step={0.0001}
                onChange={(v) => setParams({...params, gradientLearningRate: v})} 
              />
              <p className="font-bogota text-xs text-gray-500 mt-2">
                {ADVANCED_PARAM_DESCRIPTIONS.gradientLearningRate}
              </p>
            </div>
          )}
          
          <div>
            <SliderControl 
              label="Empty Penalty" 
              value={params.emptyPenaltyFraction} 
              min={0} 
              max={2} 
              step={0.1}
              onChange={(v) => setParams({...params, emptyPenaltyFraction: v})} 
            />
            <p className="font-bogota text-xs text-gray-500 mt-2">
              {ADVANCED_PARAM_DESCRIPTIONS.emptyPenaltyFraction}
            </p>
          </div>
          
          <div>
            <SliderControl 
              label="Close Penalty" 
              value={params.closePenaltyFraction} 
              min={0} 
              max={2} 
              step={0.1}
              onChange={(v) => setParams({...params, closePenaltyFraction: v})} 
            />
            <p className="font-bogota text-xs text-gray-500 mt-2">
              {ADVANCED_PARAM_DESCRIPTIONS.closePenaltyFraction}
            </p>
          </div>
          
          <div>
            <SliderControl 
              label="Min Distance (km)" 
              value={params.minDist} 
              min={0.5} 
              max={10} 
              step={0.5}
              onChange={(v) => setParams({...params, minDist: v})} 
            />
            <p className="font-bogota text-xs text-gray-500 mt-2">
              {ADVANCED_PARAM_DESCRIPTIONS.minDist}
            </p>
          </div>
          
          {params.optimizationMethod === 'genetic' && (
            <div className="space-y-3">
              <label className="font-santiago text-sm text-navy-900 block">
                Alpha Curve Strategy
              </label>
              <select
                value={params.alphaCurve}
                onChange={(e) => setParams({...params, alphaCurve: e.target.value})}
                className="w-full bg-cream-50 text-navy-900 rounded-md px-4 py-3 font-bogota text-sm border border-gray-300 focus:border-navy-600 focus:ring-2 focus:ring-navy-200 focus:outline-none"
              >
                <option value="linear">Linear (gradual shift)</option>
                <option value="expo">Exponential (rapid shift)</option>
              </select>
              <p className="font-bogota text-xs text-gray-500 mt-2">
                {ADVANCED_PARAM_DESCRIPTIONS.alphaCurve}
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onRunOptimization}
        disabled={isRunning}
        className="w-full mt-8 bg-navy-700 hover:bg-navy-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md py-4 font-santiago text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md disabled:shadow-none"
      >
        <Play className="w-5 h-5" />
        {isRunning ? `Optimizing ${progress.toFixed(0)}%` : 'Run Optimization'}
      </button>

      {isRunning && (
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-navy-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }} 
          />
        </div>
      )}
    </div>
  );
};