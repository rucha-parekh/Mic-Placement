// components/MicPlacementOptimizer.jsx

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { RegionSetup } from './RegionSetup';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ManualCoordinateInput} from './ManualCoordinateInput';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ResultsPanel } from './ResultsPanel';
import { ConvergenceChart } from './ConvergenceChart';
import { handleImageUpload } from '../utils/imageProcessing';
import { runOptimization } from '../utils/geneticAlgorithm';
import { runGradientDescent } from '../utils/gradientDescent';
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
    
    if (params.optimizationMethod === 'gradient') {
      runGradientDescent(params, activeMask, setProgress, setResults, setIsRunning);
    } else {
      runOptimization(params, activeMask, setProgress, setResults, setIsRunning);
    }
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
    
    if (params.optimizationMethod === 'gradient') {
      runGradientDescent(params, activeMask, setProgress, setResults, setIsRunning, currentCoords);
    } else {
      runOptimization(params, activeMask, setProgress, setResults, setIsRunning, currentCoords);
    }
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
    
    if (params.optimizationMethod === 'gradient') {
      runGradientDescent(params, activeMask, setProgress, setResults, setIsRunning, manualCoordinates);
    } else {
      runOptimization(params, activeMask, setProgress, setResults, setIsRunning, manualCoordinates);
    }
    setShowManualInput(false);
  };

  return (
    <div className="w-full min-h-screen bg-cream-50 p-8 sm:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-5 mb-6">
            <h1 className="font-santiago text-6xl text-navy-900">
              Acoustic Array Optimizer
            </h1>
          </div>
          <p className="font-bogota text-lg text-navy-600">
            Optimize microphone placement using genetic algorithms or gradient descent
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column - Controls */}
          <div className="space-y-8">
            <RegionSetup
              useDefaultSemicircle={useDefaultSemicircle}
              setUseDefaultSemicircle={setUseDefaultSemicircle}
              onImageUpload={onImageUpload}
              params={params}         // ← ADD THIS
              setParams={setParams} 
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
              className="w-full bg-navy-600 hover:bg-navy-700 text-cream-50 rounded-md py-4 font-bogota font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
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
          <div className="lg:col-span-2 space-y-8">
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