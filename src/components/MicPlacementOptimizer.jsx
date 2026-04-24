// components/MicPlacementOptimizer.jsx

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { RegionSetup } from './RegionSetup';
import { ConfigurationPanel } from './ConfigurationPanel';
import { ManualCoordinateInput } from './ManualCoordinateInput';
import { VisualizationCanvas } from './VisualizationCanvas';
import { ResultsPanel } from './ResultsPanel';
import { ConvergenceChart } from './ConvergenceChart';
import { handleImageUpload, processImageToMask } from '../utils/imageProcessing';
import { runOptimization } from '../utils/geneticAlgorithm';
import { runGradientDescent } from '../utils/gradientDescent';
import { runHybridOptimization } from '../utils/hybridOptimization';
import { calculateScore, validateCoordinates } from '../utils/ScoreCalculation';
import { createDefaultSemicircleMask } from '../utils/maskOperations';
import { DEFAULT_PARAMS } from '../constants/defaultParams';

const MicPlacementOptimizer = () => {
  const [image, setImage] = useState(null);
  const [imageObj, setImageObj] = useState(null);
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
  const [manualAlgorithm, setManualAlgorithm] = useState('gradient');
  const [coordError, setCoordError] = useState('');
  const [manualError, setManualError] = useState('');

  const onImageUpload = (e) => {
    handleImageUpload(e, setImage, setMask, setUseDefaultSemicircle, setImageObj, params);
  };

  // Re-process mask whenever km dimensions change and an image is already loaded
  const handleParamsChange = (newParams) => {
    setParams(newParams);
    if (
      imageObj &&
      !useDefaultSemicircle &&
      (newParams.imageWidthKm !== params.imageWidthKm ||
        newParams.imageHeightKm !== params.imageHeightKm)
    ) {
      processImageToMask(imageObj, setMask, newParams);
    }
  };

  const onRunOptimization = () => {
    const activeMask = useDefaultSemicircle
      ? createDefaultSemicircleMask(params.radius)
      : mask;

    if (params.optimizationMethod === 'gradient') {
      runGradientDescent(params, activeMask, setProgress, setResults, setIsRunning);
    } else if (params.optimizationMethod === 'hybrid') {
      runHybridOptimization(params, activeMask, setProgress, setResults, setIsRunning);
    } else {
      runOptimization(params, activeMask, setProgress, setResults, setIsRunning);
    }
    setEditMode(false);
    setCoordError('');
  };

  const handleCoordinateChange = (index, axis, value) => {
    const newResults = { ...results, best: { ...results.best } };
    if (axis === 'x') {
      newResults.best.xs = [...results.best.xs];
      newResults.best.xs[index] = value;
    } else {
      newResults.best.ys = [...results.best.ys];
      newResults.best.ys[index] = value;
    }
    setResults(newResults);
    setCoordError('');
  };

  const handleCoordinateBlur = (index, axis) => {
    const newResults = { ...results, best: { ...results.best } };
    const raw = newResults.best[axis + 's'][index];
    const numValue = (raw === '' || raw === '-') ? 0.0 : parseFloat(raw);
    if (axis === 'x') {
      newResults.best.xs = [...results.best.xs];
      newResults.best.xs[index] = isNaN(numValue) ? 0.0 : numValue;
    } else {
      newResults.best.ys = [...results.best.ys];
      newResults.best.ys[index] = isNaN(numValue) ? 0.0 : numValue;
    }
    setResults(newResults);
  };

  const reoptimizeFromEdited = () => {
    if (!results) return;

    const xs = results.best.xs.map(v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; });
    const ys = results.best.ys.map(v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; });

    const activeMask = useDefaultSemicircle
      ? createDefaultSemicircleMask(params.radius)
      : mask;

    const oob = validateCoordinates(xs, ys, activeMask);
    if (oob.length > 0) {
      const names = oob.map(p => `Mic ${p.index} (${p.x}, ${p.y})`).join(', ');
      setCoordError(
        `⚠️ ${oob.length} mic${oob.length > 1 ? 's are' : ' is'} outside the valid region and will contribute zero detection: ${names}. ` +
        `Valid range: x ∈ [−${params.radius}, ${params.radius}], y ∈ [0, ${params.radius}], within the semicircle.`
      );
    } else {
      setCoordError('');
    }

    const newResults = calculateScore(
      xs, ys, params, activeMask,
      results.algorithmType,
      results.scores
    );
    setResults(newResults);
    setEditMode(false);
  };

  const runFromManualCoordinates = () => {
    if (manualCoordinates.length === 0) {
      setManualError('Please add at least one coordinate.');
      return;
    }

    const xs = manualCoordinates.map(c => { const n = parseFloat(c.x); return isNaN(n) ? 0 : n; });
    const ys = manualCoordinates.map(c => { const n = parseFloat(c.y); return isNaN(n) ? 0 : n; });

    const activeMask = useDefaultSemicircle
      ? createDefaultSemicircleMask(params.radius)
      : mask;

    const oob = validateCoordinates(xs, ys, activeMask);
    if (oob.length > 0) {
      const names = oob.map(p => `Mic ${p.index} (${p.x}, ${p.y})`).join(', ');
      setManualError(
        `⚠️ ${oob.length} mic${oob.length > 1 ? 's are' : ' is'} outside the valid region: ${names}. ` +
        `Valid range: x ∈ [−${params.radius}, ${params.radius}], y ∈ [0, ${params.radius}], within the semicircle.`
      );
    } else {
      setManualError('');
    }

    const newResults = calculateScore(xs, ys, params, activeMask, manualAlgorithm);
    setResults(newResults);
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
              params={params}
              setParams={handleParamsChange}
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

            <button
              onClick={() => { setShowManualInput(!showManualInput); setManualError(''); }}
              className="w-full bg-navy-600 hover:bg-navy-700 text-cream-50 rounded-md py-4 font-bogota font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md"
            >
              {showManualInput ? 'Hide Manual Input' : 'Manual Coordinates'}
            </button>

            {showManualInput && (
              <>
                {manualError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="font-bogota text-xs text-red-700 leading-relaxed">{manualError}</p>
                    <p className="font-bogota text-xs text-red-500 mt-2">
                      Tip: default semicircle spans x ∈ [−{params.radius}, {params.radius}] km, y ∈ [0, {params.radius}] km.
                    </p>
                  </div>
                )}
                <ManualCoordinateInput
                  manualCoordinates={manualCoordinates}
                  setManualCoordinates={setManualCoordinates}
                  isRunning={isRunning}
                  onOptimize={runFromManualCoordinates}
                  manualAlgorithm={manualAlgorithm}
                  setManualAlgorithm={setManualAlgorithm}
                  params={params}
                />
              </>
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

            {coordError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-bogota text-xs text-red-700 leading-relaxed">{coordError}</p>
              </div>
            )}

            {results && (
              <ResultsPanel
                results={results}
                params={params}
                editMode={editMode}
                setEditMode={setEditMode}
                onCoordinateChange={handleCoordinateChange}
                onCoordinateBlur={handleCoordinateBlur}
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