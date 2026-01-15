// components/MicPlacementOptimizer.jsx

import React, { useState } from 'react';
import { Target } from 'lucide-react';
import { RegionSetup } from './RegionSetup';
import { ConfigurationPanel } from './ConfigurationPanel';
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
  const [params, setParams] = useState(DEFAULT_PARAMS);

  const onImageUpload = (e) => {
    handleImageUpload(e, setImage, setMask, setUseDefaultSemicircle);
  };

  const onRunOptimization = () => {
    const activeMask = useDefaultSemicircle 
      ? createDefaultSemicircleMask(params.radius) 
      : mask;
    runOptimization(params, activeMask, setProgress, setResults, setIsRunning);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Target className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Acoustic Array Optimizer
            </h1>
          </div>
          <p className="text-gray-400">Genetic algorithm-based microphone placement optimization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
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
          </div>

          <div className="lg:col-span-2 space-y-4">
            <VisualizationCanvas
              results={results}
              params={params}
              mask={mask}
              useDefaultSemicircle={useDefaultSemicircle}
              image={image}
            />

            <ResultsPanel results={results} params={params} />

            <ConvergenceChart results={results} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicPlacementOptimizer;