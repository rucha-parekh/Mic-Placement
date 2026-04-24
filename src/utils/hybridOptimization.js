// utils/hybridOptimization.js

import { isInMask, randomInMask, getMaskBounds } from './maskOperations';
import { evaluateIndividual } from './fitnessEvaluation';
import { runGradientDescent } from './gradientDescent';

async function runGAPhase(params, activeMask, setProgress, onGADone) {
  // ✅ FIX: use mask bounds
  const { xMin, xMax, yMin, yMax } = getMaskBounds(activeMask);
  const W = xMax - xMin;
  const H = yMax - yMin;

  const gridSize = 80;
  const gridX = Array.from({ length: gridSize }, (_, i) => xMin + (W / (gridSize - 1)) * i);
  const gridY = Array.from({ length: gridSize }, (_, i) => yMin + (H / (gridSize - 1)) * i);

  let population = [];
  for (let i = 0; i < params.popSize; i++) {
    const ind = { xs: [], ys: [], fitness: 0 };
    for (let j = 0; j < params.numRecorders; j++) {
      const pos = randomInMask(activeMask);
      ind.xs.push(pos.x);
      ind.ys.push(pos.y);
    }
    population.push(ind);
  }

  const bestScores = [];

  for (let gen = 0; gen < params.generations; gen++) {
    for (let ind of population)
      ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, gen, params);
    population.sort((a, b) => b.fitness - a.fitness);
    bestScores.push(population[0].fitness);

    setProgress(((gen + 1) / params.generations) * 50);

    const parents = population.slice(0, 5);
    const newPop = [{ ...population[0], xs: [...population[0].xs], ys: [...population[0].ys] }];

    while (newPop.length < params.popSize) {
      const p1 = parents[Math.floor(Math.random() * parents.length)];
      const p2 = parents[Math.floor(Math.random() * parents.length)];
      const a  = Math.random();
      const child = {
        xs: p1.xs.map((x, i) => a * x + (1 - a) * p2.xs[i]),
        ys: p1.ys.map((y, i) => a * y + (1 - a) * p2.ys[i]),
        fitness: 0,
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
          let tries = 0, nx, ny;
          do {
            nx = child.xs[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            ny = child.ys[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            // ✅ FIX: clamp to actual bounds
            nx = Math.max(xMin, Math.min(xMax, nx));
            ny = Math.max(yMin, Math.min(yMax, ny));
            tries++;
          } while (!isInMask(nx, ny, activeMask) && tries < 20);
          if (isInMask(nx, ny, activeMask)) { child.xs[i] = nx; child.ys[i] = ny; }
          else { const pos = randomInMask(activeMask); child.xs[i] = pos.x; child.ys[i] = pos.y; }
        }
      }
      newPop.push(child);
    }
    population = newPop;
    if (gen % 5 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }

  for (let ind of population)
    ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, params.generations - 1, params);
  population.sort((a, b) => b.fitness - a.fitness);

  const best = population[0];
  onGADone(best, bestScores);
  return best;
}

export async function runHybridOptimization(
  params,
  mask,
  setProgress,
  setResults,
  setIsRunning
) {
  setIsRunning(true);
  setProgress(0);

  let gaScores = [];

  const gaBest = await runGAPhase(params, mask, setProgress, (best, scores) => {
    gaScores = scores;
  });

  const initialCoords = gaBest.xs.map((x, i) => ({ x, y: gaBest.ys[i] }));

  const gdSetProgress = (pct) => setProgress(50 + pct / 2);

  const gdSetResults = (results) => {
    setResults({
      ...results,
      algorithmType: 'hybrid',
      scores: [...gaScores, ...results.scores],
      gaPhaseLength: gaScores.length,
    });
  };

  await runGradientDescent(
    params,
    mask,
    gdSetProgress,
    gdSetResults,
    () => {},
    initialCoords
  );

  setIsRunning(false);
}