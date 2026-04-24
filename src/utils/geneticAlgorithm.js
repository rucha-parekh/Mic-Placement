// utils/geneticAlgorithm.js
import { isInMask, randomInMask, getMaskBounds } from './maskOperations';
import { evaluateIndividual } from './fitnessEvaluation';

function detectionProb(xs, ys, gx, gy, sigma, minUnits) {
  const R = xs.length;
  const p = xs.map((rx, k) => {
    const d2 = (gx - rx) ** 2 + (gy - ys[k]) ** 2;
    return Math.exp(-d2 / (2 * sigma * sigma));
  });

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= 1 - p[i];
  if (minUnits === 1) return 1 - P0;

  let P1 = 0;
  for (let i = 0; i < R; i++) {
    let prod = p[i];
    for (let j = 0; j < R; j++) { if (j !== i) prod *= 1 - p[j]; }
    P1 += prod;
  }
  if (minUnits === 2) return 1 - P0 - P1;

  let P2 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      let prod = p[i] * p[j];
      for (let k = 0; k < R; k++) { if (k !== i && k !== j) prod *= 1 - p[k]; }
      P2 += prod;
    }
  }
  if (minUnits === 3) return 1 - P0 - P1 - P2;

  let P3 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      for (let k = j + 1; k < R; k++) {
        let prod = p[i] * p[j] * p[k];
        for (let m = 0; m < R; m++) { if (m !== i && m !== j && m !== k) prod *= 1 - p[m]; }
        P3 += prod;
      }
    }
  }
  return 1 - P0 - P1 - P2 - P3;
}

export const runOptimization = async (
  params,
  activeMask,
  setProgress,
  setResults,
  setIsRunning,
  initialCoords = null
) => {
  if (!activeMask) {
    alert('Please upload an image or use default semicircle!');
    return;
  }
  setIsRunning(true);
  setProgress(0);

  const sigma  = params.sd;
  // ✅ FIX: derive all bounds from the mask, not hardcoded values
  const { xMin, xMax, yMin, yMax } = getMaskBounds(activeMask);
  const W = xMax - xMin;
  const H = yMax - yMin;

  // Fitness grid — covers the mask's actual world extent
  const gridSize = 80;
  const gridX = Array.from({ length: gridSize }, (_, i) => xMin + (W / (gridSize - 1)) * i);
  const gridY = Array.from({ length: gridSize }, (_, i) => yMin + (H / (gridSize - 1)) * i);

  // ── Initialise population ─────────────────────────────────────────────────
  let population = [];
  if (initialCoords && initialCoords.length > 0) {
    population.push({ xs: initialCoords.map(c => c.x), ys: initialCoords.map(c => c.y), fitness: 0 });
    for (let i = 1; i < params.popSize; i++) {
      const ind = { xs: [], ys: [], fitness: 0 };
      for (let j = 0; j < initialCoords.length; j++) {
        const pos = randomInMask(activeMask); ind.xs.push(pos.x); ind.ys.push(pos.y);
      }
      population.push(ind);
    }
  } else {
    for (let i = 0; i < params.popSize; i++) {
      const ind = { xs: [], ys: [], fitness: 0 };
      for (let j = 0; j < params.numRecorders; j++) {
        const pos = randomInMask(activeMask); ind.xs.push(pos.x); ind.ys.push(pos.y);
      }
      population.push(ind);
    }
  }

  const bestScores = [];

  // ── Main GA loop ──────────────────────────────────────────────────────────
  for (let gen = 0; gen < params.generations; gen++) {
    for (let ind of population)
      ind.fitness = evaluateIndividual(ind, gridX, gridY, activeMask, gen, params);
    population.sort((a, b) => b.fitness - a.fitness);
    bestScores.push(population[0].fitness);
    setProgress(((gen + 1) / params.generations) * 100);

    const parents = population.slice(0, 5);
    const newPop  = [{ ...population[0], xs: [...population[0].xs], ys: [...population[0].ys] }];

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
          const pos = randomInMask(activeMask); child.xs[i] = pos.x; child.ys[i] = pos.y;
        }
      }
      for (let i = 0; i < child.xs.length; i++) {
        if (Math.random() < params.mutationRate) {
          let tries = 0, nx, ny;
          do {
            nx = child.xs[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            ny = child.ys[i] + (Math.random() - 0.5) * 2 * params.mutationStd;
            // ✅ FIX: clamp to actual mask bounds, not hardcoded ±30
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

  // ── Visualisation probability map ─────────────────────────────────────────
  const vizNx = 200, vizNy = 120;
  // ✅ FIX: viz grid also uses mask bounds
  const pgX = Array.from({ length: vizNx }, (_, i) => xMin + (W * i) / (vizNx - 1));
  const pgY = Array.from({ length: vizNy }, (_, i) => yMin + (H * i) / (vizNy - 1));
  const minUnits = best.xs.length >= 4 ? 4 : 1;

  const probabilityMap = Array.from({ length: vizNy }, (_, yi) =>
    Array.from({ length: vizNx }, (_, xi) => {
      const gx = pgX[xi], gy = pgY[yi];
      if (!isInMask(gx, gy, activeMask)) return 0;
      return detectionProb(best.xs, best.ys, gx, gy, sigma, minUnits);
    })
  );

  let sumP = 0, cnt = 0;
  for (let yi = 0; yi < vizNy; yi++)
    for (let xi = 0; xi < vizNx; xi++)
      if (probabilityMap[yi][xi] > 0) { sumP += probabilityMap[yi][xi]; cnt++; }
  const meanProbability = cnt > 0 ? sumP / cnt : 0;

  setResults({
    best: { xs: best.xs, ys: best.ys, fitness: best.fitness, meanProbability },
    scores: bestScores,
    algorithmType: 'genetic',
    probabilityMap,
    gridX: pgX,
    gridY: pgY,
    physicalPositions: best.xs.map((x, i) => [x, best.ys[i]]),
    mask: activeMask,
    minUnits,
    vmax: 1,
  });

  setIsRunning(false);
  setProgress(100);
};