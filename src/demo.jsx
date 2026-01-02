import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Settings, ChevronDown, ChevronUp, Target } from 'lucide-react';

const MicPlacementOptimizer = () => {
  const [image, setImage] = useState(null);
  const [mask, setMask] = useState(null);
  const [useDefaultSemicircle, setUseDefaultSemicircle] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [params, setParams] = useState({
    numRecorders: 8,
    generations: 100,
    popSize: 30,
    mutationRate: 0.3,
    mutationStd: 1.5,
    radius: 20.0,
    sd: 10.0,
    emptyPenaltyFraction: 0.3,
    closePenaltyFraction: 0.2,
    minDist: 3.0,
    alphaCurve: 'linear'
  });

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(event.target.result);
          processImageToMask(img);
          setUseDefaultSemicircle(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const processImageToMask = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    const maskArray = [];
    
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
      maskArray.push(brightness > 128 ? 1 : 0);
    }
    
    setMask({ data: maskArray, width: img.width, height: img.height });
  };

  const createDefaultSemicircleMask = (radius) => {
    const width = 200;
    const height = 200;
    const maskArray = [];
    
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        const x = (i / width) * 60 - 30;
        const y = (j / height) * 30;
        const dist = Math.sqrt(x * x + y * y);
        maskArray.push(dist <= radius && y >= 0 ? 1 : 0);
      }
    }
    
    return { data: maskArray, width, height };
  };

  const halfNormal = (x, sd) => Math.exp(-x * x / (2 * sd * sd));

  const computeAlpha = (generation, totalGenerations, curve) => {
    if (curve === 'linear') return generation / totalGenerations;
    if (curve === 'expo') return 1 - Math.exp(-4 * generation / totalGenerations);
    return generation / totalGenerations;
  };

  const isInMask = (x, y, maskData) => {
    if (!maskData) return true;
    const ix = Math.floor((x + 30) / 60 * maskData.width);
    const iy = Math.floor(y / 30 * maskData.height);
    if (ix < 0 || ix >= maskData.width || iy < 0 || iy >= maskData.height) return false;
    return maskData.data[iy * maskData.width + ix] === 1;
  };

  const randomInMask = (maskData) => {
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.random() * 60 - 30;
      const y = Math.random() * 30;
      if (isInMask(x, y, maskData)) return { x, y };
    }
    
    for (let i = 0; i < maskData.data.length; i++) {
      if (maskData.data[i] === 1) {
        const x = (i % maskData.width) / maskData.width * 60 - 30;
        const y = Math.floor(i / maskData.width) / maskData.height * 30;
        return { x, y };
      }
    }
    return { x: 0, y: 10 };
  };

  const computeProbabilityMap = (ind, gridX, gridY) => {
    const probMap = Array(gridX.length).fill(0).map(() => Array(gridY.length).fill(0));
    
    for (let i = 0; i < gridX.length; i++) {
      for (let j = 0; j < gridY.length; j++) {
        let noDetProb = 1;
        for (let k = 0; k < ind.xs.length; k++) {
          const dist = Math.sqrt((gridX[i] - ind.xs[k]) ** 2 + (gridY[j] - ind.ys[k]) ** 2);
          noDetProb *= (1 - halfNormal(dist, params.sd));
        }
        probMap[i][j] = 1 - noDetProb;
      }
    }
    return probMap;
  };

  const evaluateIndividual = (ind, gridX, gridY, activeMask, generation) => {
    const probMap = computeProbabilityMap(ind, gridX, gridY);
    const alpha = computeAlpha(generation, params.generations, params.alphaCurve);
    
    let mainScore = 0, helperScore = 0, count = 0, lowProbCount = 0;
    
    for (let i = 0; i < gridX.length; i++) {
      for (let j = 0; j < gridY.length; j++) {
        if (isInMask(gridX[i], gridY[j], activeMask)) {
          const prob = probMap[i][j];
          mainScore += prob;
          helperScore += prob > 0 ? 1 : 0;
          if (prob < 0.2) lowProbCount++;
          count++;
        }
      }
    }
    
    let score = 0;
    if (count > 0) {
      mainScore /= count;
      helperScore /= count;
      score = alpha * mainScore + (1 - alpha) * helperScore;
      score -= params.emptyPenaltyFraction * (lowProbCount / count);
    }

    let tooCloseCount = 0, totalPairs = 0;
    for (let i = 0; i < ind.xs.length; i++) {
      for (let j = i + 1; j < ind.xs.length; j++) {
        const dist = Math.sqrt((ind.xs[i] - ind.xs[j]) ** 2 + (ind.ys[i] - ind.ys[j]) ** 2);
        if (dist < params.minDist) tooCloseCount++;
        totalPairs++;
      }
    }
    if (totalPairs > 0) score -= params.closePenaltyFraction * (tooCloseCount / totalPairs);

    return score;
  };

  const runOptimization = async () => {
    const activeMask = useDefaultSemicircle ? createDefaultSemicircleMask(params.radius) : mask;
    if (!activeMask) {
      alert('Please upload an image or use default semicircle!');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    
    const gridSize = 80;
    const gridX = Array.from({ length: gridSize }, (_, i) => -30 + (60 / (gridSize - 1)) * i);
    const gridY = Array.from({ length: gridSize }, (_, i) => 0 + (30 / (gridSize - 1)) * i);

    let population = [];
    for (let i = 0; i < params.popSize; i++) {
      const individual = { xs: [], ys: [], fitness: 0 };
      for (let j = 0; j < params.numRecorders; j++) {
        const pos = randomInMask(activeMask);
        individual.xs.push(pos.x);
        individual.ys.push(pos.y);
      }
      population.push(individual);
    }

    const bestScores = [];

    for (let gen = 0; gen < params.generations; gen++) {
      for (let ind of population) {
        ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, gen);
      }

      population.sort((a, b) => b.fitness - a.fitness);
      bestScores.push(population[0].fitness);
      setProgress(((gen + 1) / params.generations) * 100);

      const parents = population.slice(0, 5);
      const newPopulation = [{ ...population[0], xs: [...population[0].xs], ys: [...population[0].ys] }];

      while (newPopulation.length < params.popSize) {
        const p1 = parents[Math.floor(Math.random() * parents.length)];
        const p2 = parents[Math.floor(Math.random() * parents.length)];
        const alpha = Math.random();
        const child = {
          xs: p1.xs.map((x, i) => alpha * x + (1 - alpha) * p2.xs[i]),
          ys: p1.ys.map((y, i) => alpha * y + (1 - alpha) * p2.ys[i]),
          fitness: 0
        };

        for (let i = 0; i < child.xs.length; i++) {
          if (!isInMask(child.xs[i], child.ys[i], activeMask)) {
            const pos = randomInMask(activeMask);
            child.xs[i] = pos.x;
            child.ys[i] = pos.y;
          }
        }

        for (let i = 0; i < child.xs.length; i++) {
          if (Math.random() < params.mutationRate) {
            let attempts = 0, newX, newY;
            do {
              newX = child.xs[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
              newY = child.ys[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
              newX = Math.max(-30, Math.min(30, newX));
              newY = Math.max(0, Math.min(30, newY));
              attempts++;
            } while (!isInMask(newX, newY, activeMask) && attempts < 20);
            
            if (isInMask(newX, newY, activeMask)) {
              child.xs[i] = newX;
              child.ys[i] = newY;
            } else {
              const pos = randomInMask(activeMask);
              child.xs[i] = pos.x;
              child.ys[i] = pos.y;
            }
          }
        }
        newPopulation.push(child);
      }

      population = newPopulation;
      if (gen % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }

    for (let ind of population) ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, params.generations - 1);
    population.sort((a, b) => b.fitness - a.fitness);

    setResults({ best: population[0], scores: bestScores, gridX, gridY, mask: activeMask });
    setIsRunning(false);
    setProgress(100);
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const activeMask = results ? results.mask : (useDefaultSemicircle ? createDefaultSemicircleMask(params.radius) : mask);

    if (activeMask) {
      ctx.fillStyle = '#1a1a1a';
      for (let i = 0; i < activeMask.data.length; i++) {
        if (activeMask.data[i] === 1) {
          const x = (i % activeMask.width) / activeMask.width * width;
          const y = Math.floor(i / activeMask.width) / activeMask.height * height;
          ctx.fillRect(x, y, width / activeMask.width + 1, height / activeMask.height + 1);
        }
      }
    }

    if (image && !useDefaultSemicircle && imageRef.current) {
      ctx.globalAlpha = 0.2;
      ctx.drawImage(imageRef.current, 0, 0, width, height);
      ctx.globalAlpha = 1.0;
    }

    if (results) {
      const probMap = computeProbabilityMap(results.best, results.gridX, results.gridY);
      const cellWidth = width / results.gridX.length;
      const cellHeight = height / results.gridY.length;

      for (let i = 0; i < results.gridX.length; i++) {
        for (let j = 0; j < results.gridY.length; j++) {
          if (isInMask(results.gridX[i], results.gridY[j], activeMask)) {
            const prob = probMap[i][j];
            const x = (results.gridX[i] + 30) / 60 * width;
            const y = results.gridY[j] / 30 * height;
            const hue = 280 - prob * 280;
            ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${prob * 0.6})`;
            ctx.fillRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);
          }
        }
      }

      for (let i = 0; i < results.best.xs.length; i++) {
        const x = (results.best.xs[i] + 30) / 60 * width;
        const y = results.best.ys[i] / 30 * height;
        
        ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i + 1, x, y);
      }
    }
  }, [results, params.radius, mask, useDefaultSemicircle, image, params.sd]);

  const SliderControl = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <span className="text-sm font-mono text-blue-400 bg-gray-800 px-2 py-1 rounded">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );

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
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                Region Setup
              </h2>
              
              <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors mb-3">
                <input
                  type="checkbox"
                  checked={useDefaultSemicircle}
                  onChange={(e) => setUseDefaultSemicircle(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <span className="text-sm">Default Semicircle Region</span>
              </label>

              {!useDefaultSemicircle && (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer file:transition-colors"
                  />
                  <p className="text-xs text-gray-500">Binary image: white = valid areas</p>
                </div>
              )}
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Configuration
              </h2>
              
              <div className="space-y-4">
                <SliderControl label="Microphones" value={params.numRecorders} min={1} max={20} step={1} 
                  onChange={(v) => setParams({...params, numRecorders: v})} />
                <SliderControl label="Generations" value={params.generations} min={10} max={500} step={10}
                  onChange={(v) => setParams({...params, generations: v})} />
                <SliderControl label="Detection Range (km)" value={params.sd} min={1} max={30} step={1}
                  onChange={(v) => setParams({...params, sd: v})} />
                {useDefaultSemicircle && (
                  <SliderControl label="Region Radius (km)" value={params.radius} min={5} max={30} step={1}
                    onChange={(v) => setParams({...params, radius: v})} />
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
                  <SliderControl label="Population Size" value={params.popSize} min={10} max={100} step={5}
                    onChange={(v) => setParams({...params, popSize: v})} />
                  <SliderControl label="Mutation Rate" value={params.mutationRate} min={0} max={1} step={0.05}
                    onChange={(v) => setParams({...params, mutationRate: v})} />
                  <SliderControl label="Mutation Std Dev" value={params.mutationStd} min={0.1} max={10} step={0.5}
                    onChange={(v) => setParams({...params, mutationStd: v})} />
                  <SliderControl label="Empty Penalty" value={params.emptyPenaltyFraction} min={0} max={2} step={0.1}
                    onChange={(v) => setParams({...params, emptyPenaltyFraction: v})} />
                  <SliderControl label="Close Penalty" value={params.closePenaltyFraction} min={0} max={2} step={0.1}
                    onChange={(v) => setParams({...params, closePenaltyFraction: v})} />
                  <SliderControl label="Min Distance (km)" value={params.minDist} min={0.5} max={10} step={0.5}
                    onChange={(v) => setParams({...params, minDist: v})} />
                  
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
                onClick={runOptimization}
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
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{results ? 'Optimized Placement' : 'Region Preview'}</h2>
              <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
                {image && !useDefaultSemicircle && <img ref={imageRef} src={image} alt="Region" className="hidden" />}
                <canvas ref={canvasRef} width={800} height={400} className="w-full" />
              </div>
              
              {results && (
                <>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-600/50 rounded-lg p-4">
                      <div className="text-xs text-green-300 mb-1 font-medium">Fitness Score</div>
                      <div className="text-2xl font-bold text-green-400">{results.best.fitness.toFixed(4)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-600/50 rounded-lg p-4">
                      <div className="text-xs text-blue-300 mb-1 font-medium">Array Configuration</div>
                      <div className="text-2xl font-bold text-blue-400">{params.numRecorders} mics</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">Coordinates (km)</div>
                    <div className="max-h-48 overflow-y-auto bg-gray-900/50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2">
                        {results.best.xs.map((x, i) => (
                          <div key={i} className="bg-gray-700/50 rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </div>
                            <span className="font-mono text-gray-300">({x.toFixed(2)}, {results.best.ys[i].toFixed(2)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {results && (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Convergence History</h2>
                <div className="bg-black rounded-lg p-4">
                  <svg width="100%" height="200" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{stopColor: '#3b82f6'}} />
                        <stop offset="100%" style={{stopColor: '#8b5cf6'}} />
                      </linearGradient>
                      <linearGradient id="ag" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.4}} />
                        <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0}} />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`0,200 ${results.scores.map((s, i) => 
                        `${(i / (results.scores.length - 1)) * 800},${200 - Math.min(s, 1) * 180}`
                      ).join(' ')} 800,200`}
                      fill="url(#ag)"
                    />
                    <polyline
                      points={results.scores.map((s, i) => 
                        `${(i / (results.scores.length - 1)) * 800},${200 - Math.min(s, 1) * 180}`
                      ).join(' ')}
                      fill="none"
                      stroke="url(#lg)"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-xs text-gray-400 text-center">
                  Generation → Fitness progression showing algorithm convergence
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MicPlacementOptimizer;