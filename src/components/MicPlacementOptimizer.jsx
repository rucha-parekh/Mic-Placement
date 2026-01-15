// components/MicPlacementOptimizer.jsx

import React, { useState } from 'react';
import { Target, Plus } from 'lucide-react';
import { RegionSetup } from './RegionSetup';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ManualCoordinateInput } from './ManualCoordinateInput';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ResultsPanel } from './ResultsPanel';
import { ConvergenceChart } from './ConvergenceChart';
import { handleImageUpload } from '../utils/imageProcessing';
import { runOptimization } from '../utils/geneticAlgorithm';
import { createDefaultSemicircleMask } from '../utils/maskOperations';
import { DEFAULT_PARAMS } from '../constants/defaultParams';

const MicPlacementOptimizer = () => {
  const [image, setImage] = useState(null);
  const [mask, setMask] = useState(null);
  const [useDefaultSemicircle, setUseDefaultSemicircle] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [manualCoordinates, setManualCoordinates] = useState([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [params, setParams] = useState(DEFAULT_PARAMS);

  const onImageUpload = (e) => {
    handleImageUpload(e, setImage, setMask, setUseDefaultSemicircle);
  };

  const onRunOptimization = () => {
    const activeMask = useDefaultSemicircle 
      ? createDefaultSemicircleMask(params.radius) 
      : mask;
    runOptimization(params, activeMask, setProgress, setResults, setIsRunning);
    setEditMode(false);
  };

  const handleCoordinateChange = (index, axis, value) => {
    const newResults = { ...results };
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      if (axis === 'x') {
        newResults.best.xs[index] = numValue;
      } else {
        newResults.best.ys[index] = numValue;
      }
      setResults(newResults);
    }
  };

  const reoptimizeFromEdited = () => {
    if (!results) return;
    const currentCoords = results.best.xs.map((x, i) => ({ x, y: results.best.ys[i] }));
    const activeMask = useDefaultSemicircle 
      ? createDefaultSemicircleMask(params.radius) 
      : mask;
    runOptimization(params, activeMask, setProgress, setResults, setIsRunning, currentCoords);
    setEditMode(false);
  };

  const runFromManualCoordinates = () => {
    if (manualCoordinates.length === 0) {
      alert('Please add at least one coordinate!');
      return;
    }
    const activeMask = useDefaultSemicircle 
      ? createDefaultSemicircleMask(params.radius) 
      : mask;
    runOptimization(params, activeMask, setProgress, setResults, setIsRunning, manualCoordinates);
    setShowManualInput(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-stone-50 via-amber-50 to-stone-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl">
              <Target className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black text-stone-800 tracking-tight">
              Acoustic Array Optimizer
            </h1>
          </div>
          <p className="text-lg text-stone-600 font-medium">
            Genetic algorithm-based microphone placement optimization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <RegionSetup
              useDefaultSemicircle={useDefaultSemicircle}
              setUseDefaultSemicircle={setUseDefaultSemicircle}
              onImageUpload={onImageUpload}
            />

            <ConfigurationPanel
              params={params}
              setParams={setParams}
              showAdvanced={showAdvanced}
              setShowAdvanced={setShowAdvanced}
              useDefaultSemicircle={useDefaultSemicircle}
              isRunning={isRunning}
              progress={progress}
              onRunOptimization={onRunOptimization}
            />

            {/* Manual Input Toggle Button */}
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl py-4 font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border-2 border-amber-600"
            >
              <Plus className="w-5 h-5" />
              {showManualInput ? 'Hide Manual Input' : 'Manual Coordinates'}
            </button>

            {showManualInput && (
              <ManualCoordinateInput
                manualCoordinates={manualCoordinates}
                setManualCoordinates={setManualCoordinates}
                isRunning={isRunning}
                onOptimize={runFromManualCoordinates}
              />
            )}
          </div>

          {/* Right Column - Visualization & Results */}
          <div className="lg:col-span-2 space-y-6">
            <VisualizationCanvas
              results={results}
              params={params}
              mask={mask}
              useDefaultSemicircle={useDefaultSemicircle}
              image={image}
            />

            {results && (
              <ResultsPanel
                results={results}
                params={params}
                editMode={editMode}
                setEditMode={setEditMode}
                onCoordinateChange={handleCoordinateChange}
                onReoptimize={reoptimizeFromEdited}
                isRunning={isRunning}
              />
            )}

            {results && <ConvergenceChart results={results} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicPlacementOptimizer;