// utils/scoreCalculation.js
//
// Computes the detection probability map and mean score for a fixed set of
// microphone positions — no optimisation, just pure evaluation + visualisation.
//
// Used by:
//   • "Re-calculate Score" after editing coordinates in ResultsPanel
//   • "Visualize & Score" from ManualCoordinateInput

import { isInMask } from './maskOperations';

/**
 * P(detected by >= minUnits recorders) at a single grid point.
 * Exact inclusion-exclusion — identical to the formula used in geneticAlgorithm.js.
 */
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
  return 1 - P0 - P1 - P2 - P3; // P(≥4)
}

/**
 * validateCoordinates
 *
 * Checks which mic positions fall outside the valid region.
 * For the default semicircle the valid region is:
 *   x ∈ [-radius, +radius], y ∈ [0, radius], x²+y² ≤ radius²
 * For a custom mask it uses isInMask directly.
 *
 * Returns an array of { index, x, y } for every out-of-bounds mic.
 */
export function validateCoordinates(xs, ys, mask) {
  const outOfBounds = [];
  for (let i = 0; i < xs.length; i++) {
    if (!isInMask(xs[i], ys[i], mask)) {
      outOfBounds.push({ index: i + 1, x: xs[i], y: ys[i] });
    }
  }
  return outOfBounds;
}

/**
 * calculateScore
 *
 * Places microphones at the given positions, computes the probability map,
 * and returns a results object compatible with the rest of the UI.
 *
 * @param {number[]} xs            - x coordinates of microphones (km)
 * @param {number[]} ys            - y coordinates of microphones (km)
 * @param {object}   params        - app params (radius, sd, …)
 * @param {object}   mask          - mask object passed to isInMask
 * @param {string}   algorithmType - 'gradient' | 'genetic'  (affects label only)
 * @param {number[]|null} existingScores - previous convergence scores to preserve (optional)
 * @returns {object}  results object ready for setResults()
 */
export function calculateScore(xs, ys, params, mask, algorithmType = 'gradient', existingScores = null) {
  const RADIUS = params.radius;
  const sigma  = params.sd;

  const vizNx = 200, vizNy = 120;
  const pgX = Array.from({ length: vizNx }, (_, i) => -RADIUS + (2 * RADIUS * i) / (vizNx - 1));
  const pgY = Array.from({ length: vizNy }, (_, i) => (RADIUS * i) / (vizNy - 1));

  // Use P(≥4) when 4+ mics, P(≥3) for 3, P(≥1) for fewer — matches existing convention
  const minUnits = xs.length >= 4 ? 4 : xs.length >= 3 ? 3 : 1;

  const probabilityMap = Array.from({ length: vizNy }, (_, yi) =>
    Array.from({ length: vizNx }, (_, xi) => {
      const gx = pgX[xi], gy = pgY[yi];
      if (!isInMask(gx, gy, mask)) return 0;
      return detectionProb(xs, ys, gx, gy, sigma, minUnits);
    })
  );

  let sumP = 0, cnt = 0;
  for (let yi = 0; yi < vizNy; yi++)
    for (let xi = 0; xi < vizNx; xi++)
      if (probabilityMap[yi][xi] > 0) { sumP += probabilityMap[yi][xi]; cnt++; }
  const meanProbability = cnt > 0 ? sumP / cnt : 0;

  return {
    best: {
      xs: [...xs],
      ys: [...ys],
      meanProbability,
      fitness: meanProbability,
    },
    // Keep previous convergence chart data if available, otherwise a flat line
    scores: existingScores ?? [meanProbability],
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