// utils/hybridOptimization.js
//
// Exact port of Python notebook cells 9-11:
//   1. Run GA (same as geneticAlgorithm.js) to convergence
//   2. Take best individual's positions as initial_positions
//   3. Feed into run_gradient_descent_with_penalties_ga_init (same as gradientDescent.js
//      but initialised from GA output instead of random)
//
// The GA phase uses alpha blending (as Python does).
// The GD phase uses hazardRate and the same penalty functions as gradientDescent.js.

import { isInMask, randomInMask } from './maskOperations';
import { evaluateIndividual } from './fitnessEvaluation';
import { runGradientDescent } from './gradientDescent';

// ── GA phase (mirrors geneticAlgorithm.js exactly) ───────────────────────────

async function runGAPhase(params, activeMask, setProgress, onGADone) {
  const sigma  = params.radius;  // grid scale
  const RADIUS = params.radius;

  const gridSize = 80;
  const gridX = Array.from({ length: gridSize }, (_, i) => -30 + (60 / (gridSize - 1)) * i);
  const gridY = Array.from({ length: gridSize }, (_, i) => (30 / (gridSize - 1)) * i);

  // Initialise population
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

    // Report GA phase as 0-50% of total progress
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
            nx = Math.max(-30, Math.min(30, nx));
            ny = Math.max(0,   Math.min(30, ny));
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

  // Final evaluation
  for (let ind of population)
    ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, params.generations - 1, params);
  population.sort((a, b) => b.fitness - a.fitness);

  const best = population[0];
  onGADone(best, bestScores);
  return best;
}

// ── Hybrid entry point ───────────────────────────────────────────────────────

/**
 * runHybridOptimization
 *
 * Phase 1 (GA): runs params.generations generations of the genetic algorithm.
 *               Progress reported as 0-50%.
 * Phase 2 (GD): seeds gradient descent with GA best positions.
 *               Progress reported as 50-100%.
 *
 * Final result has algorithmType = 'hybrid'.
 */
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

  // Phase 1: GA
  const gaBest = await runGAPhase(params, mask, setProgress, (best, scores) => {
    gaScores = scores;
  });

  // ga_initial_positions = np.column_stack((best.xs, best.ys))
  const initialCoords = gaBest.xs.map((x, i) => ({ x, y: gaBest.ys[i] }));

  // Phase 2: GD seeded from GA — wrap setProgress to map 50-100%
  const gdSetProgress = (pct) => setProgress(50 + pct / 2);

  // Wrap setResults to tag as hybrid and merge GA scores into convergence chart
  const gdSetResults = (results) => {
    setResults({
      ...results,
      algorithmType: 'hybrid',
      // Prepend GA scores so convergence chart shows both phases
      scores: [...gaScores, ...results.scores],
      gaPhaseLength: gaScores.length,   // lets ConvergenceChart annotate the boundary
    });
  };

  await runGradientDescent(
    params,
    mask,
    gdSetProgress,
    gdSetResults,
    () => {},        // isRunning managed here, not inside GD
    initialCoords
  );

  setIsRunning(false);
}