// utils/scoreCalculation.js
//
// Computes the detection probability map and score for a fixed set of
// microphone positions — no optimisation loop, just evaluation + visualisation.
//
// algorithmType now genuinely affects the score:
//   'gradient' → meanProbability  (mean P(≥N) across the region, same as GD displays)
//   'genetic'  → penalised fitness (meanFour − emptyPenalty − closePenalty,
//                same formula as fitnessEvaluation.js uses during GA optimisation)

import { isInMask } from './maskOperations';

// ─── shared inclusion-exclusion ───────────────────────────────────────────────

function detectionProb(xs, ys, gx, gy, sigma, minUnits) {
  const R = xs.length;
  const q = xs.map((rx, k) => {
    const d2 = (gx - rx) ** 2 + (gy - ys[k]) ** 2;
    return 1 - Math.exp(-d2 / (2 * sigma * sigma));
  });
  const p = q.map(qi => 1 - qi);

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= q[i];
  if (minUnits <= 1) return 1 - P0;

  let P1 = 0;
  for (let i = 0; i < R; i++)
    P1 += q[i] > 0 ? P0 * p[i] / q[i] : p[i];
  if (minUnits <= 2) return 1 - P0 - P1;

  let P2 = 0;
  for (let i = 0; i < R; i++) {
    const ri = q[i] > 0 ? p[i] / q[i] : p[i];
    for (let j = i + 1; j < R; j++) {
      P2 += P0 * ri * (q[j] > 0 ? p[j] / q[j] : p[j]);
    }
  }
  if (minUnits <= 3) return 1 - P0 - P1 - P2;

  let P3 = 0;
  for (let i = 0; i < R; i++) {
    const ri = q[i] > 0 ? p[i] / q[i] : p[i];
    for (let j = i + 1; j < R; j++) {
      const rj = q[j] > 0 ? p[j] / q[j] : p[j];
      for (let k = j + 1; k < R; k++) {
        P3 += P0 * ri * rj * (q[k] > 0 ? p[k] / q[k] : p[k]);
      }
    }
  }
  return 1 - P0 - P1 - P2 - P3;
}

// ─── genetic fitness penalties (mirrors fitnessEvaluation.js exactly) ─────────

function computeGeneticFitness(xs, ys, probabilityMap, gridX, gridY, params) {
  const R = xs.length;
  const minUnitsMain = R >= 4 ? 4 : 1;

  let sumFour = 0, count = 0, lowCount = 0;

  for (let yi = 0; yi < gridY.length; yi++) {
    for (let xi = 0; xi < gridX.length; xi++) {
      const val = probabilityMap[yi][xi];
      if (val === 0) continue; // outside mask
      sumFour += val;
      if (val < 0.2) lowCount++;
      count++;
    }
  }

  if (count === 0) return 0;

  const meanFour = sumFour / count;

  const emptyPenalty = params.emptyPenaltyFraction * meanFour * (lowCount / count);

  let closePairs = 0, totalPairs = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const dist = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
      if (dist < params.minDist) closePairs++;
      totalPairs++;
    }
  }
  const closePenalty = totalPairs > 0
    ? params.closePenaltyFraction * meanFour * (closePairs / totalPairs)
    : 0;

  return meanFour - emptyPenalty - closePenalty;
}

// ─── coordinate validation ────────────────────────────────────────────────────

export function validateCoordinates(xs, ys, mask) {
  const outOfBounds = [];
  for (let i = 0; i < xs.length; i++) {
    if (!isInMask(xs[i], ys[i], mask)) {
      outOfBounds.push({ index: i + 1, x: xs[i], y: ys[i] });
    }
  }
  return outOfBounds;
}

// ─── main export ──────────────────────────────────────────────────────────────

/**
 * calculateScore
 *
 * Places microphones at fixed positions and computes the score.
 * algorithmType genuinely changes the score:
 *
 *   'gradient' → meanProbability (mean P(≥N), same as gradient descent displays)
 *   'genetic'  → penalised fitness (meanFour − emptyPenalty − closePenalty,
 *                same as what the GA optimises in fitnessEvaluation.js)
 */
export function calculateScore(xs, ys, params, mask, algorithmType = 'gradient', existingScores = null) {
  const RADIUS = params.radius;
  const sigma  = params.sd;

  const vizNx = 200, vizNy = 120;
  const pgX = Array.from({ length: vizNx }, (_, i) => -RADIUS + (2 * RADIUS * i) / (vizNx - 1));
  const pgY = Array.from({ length: vizNy }, (_, i) => (RADIUS * i) / (vizNy - 1));

  const minUnits = xs.length >= 4 ? 4 : xs.length >= 3 ? 3 : 1;

  // Build probability map (same for both algorithms — it's the visualisation)
  const probabilityMap = Array.from({ length: vizNy }, (_, yi) =>
    Array.from({ length: vizNx }, (_, xi) => {
      const gx = pgX[xi], gy = pgY[yi];
      if (!isInMask(gx, gy, mask)) return 0;
      return detectionProb(xs, ys, gx, gy, sigma, minUnits);
    })
  );

  // meanProbability — used by gradient descent and also for the heatmap label
  let sumP = 0, cnt = 0;
  for (let yi = 0; yi < vizNy; yi++)
    for (let xi = 0; xi < vizNx; xi++)
      if (probabilityMap[yi][xi] > 0) { sumP += probabilityMap[yi][xi]; cnt++; }
  const meanProbability = cnt > 0 ? sumP / cnt : 0;

  // geneticFitness — penalised score, only computed when needed
  const geneticFitness = algorithmType === 'genetic'
    ? computeGeneticFitness(xs, ys, probabilityMap, pgX, pgY, params)
    : null;

  // The displayed score depends on which algorithm is selected
  const displayedFitness = algorithmType === 'genetic' ? geneticFitness : meanProbability;

  return {
    best: {
      xs: [...xs],
      ys: [...ys],
      meanProbability,                    // always available for heatmap label
      fitness: displayedFitness,          // what shows in the Fitness / Mean P panel
    },
    scores: existingScores ?? [displayedFitness],
    algorithmType,
    probabilityMap,
    gridX: pgX,
    gridY: pgY,
    physicalPositions: xs.map((x, i) => [x, ys[i]]),
    radius: RADIUS,
    minUnits,
    vmax: 1,
  };
}