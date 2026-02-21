// utils/fitnessEvaluation.js
// Matches Python's Environment.evaluate() exactly:
//   score = alpha * P_four_plus + (1-alpha) * P_helper
// where P_four_plus = mean P(>=4 units) inside mask
//       P_helper    = mean P(>=1 unit)  inside mask  [the "detection_probabilities_single"]

import { isInMask } from './maskOperations';

export const halfNormal = (x, sd) => Math.exp(-x * x / (2 * sd * sd));

export const computeAlpha = (generation, totalGenerations, curve) => {
  if (curve === 'expo') return 1 - Math.exp(-4 * generation / totalGenerations);
  return generation / totalGenerations; // linear (default)
};

/**
 * Compute per-recorder detection probability at a single grid point.
 * p_r = halfNormal(dist(grid_point, recorder_r), sd)
 */
function recorderProbs(xs, ys, gx, gy, sd) {
  return xs.map((rx, k) => {
    const dist = Math.sqrt((gx - rx) ** 2 + (gy - ys[k]) ** 2);
    return halfNormal(dist, sd);
  });
}

/**
 * P(at least minUnits detections) via inclusion-exclusion.
 * minUnits=1 → P_helper  (detection_probabilities_single in Python)
 * minUnits=4 → P_four_plus (detection_probabilities in Python)
 */
function pAtLeast(probs, minUnits) {
  const R = probs.length;

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= 1 - probs[i];
  if (minUnits <= 1) return 1 - P0;

  let P1 = 0;
  for (let i = 0; i < R; i++) {
    let prod = probs[i];
    for (let j = 0; j < R; j++) { if (j !== i) prod *= 1 - probs[j]; }
    P1 += prod;
  }
  if (minUnits <= 2) return 1 - P0 - P1;

  let P2 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      let prod = probs[i] * probs[j];
      for (let k = 0; k < R; k++) { if (k !== i && k !== j) prod *= 1 - probs[k]; }
      P2 += prod;
    }
  }
  if (minUnits <= 3) return 1 - P0 - P1 - P2;

  // P(>=4) — four_plus, the primary metric in Python
  let P3 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      for (let k = j + 1; k < R; k++) {
        let prod = probs[i] * probs[j] * probs[k];
        for (let m = 0; m < R; m++) {
          if (m !== i && m !== j && m !== k) prod *= 1 - probs[m];
        }
        P3 += prod;
      }
    }
  }
  return 1 - P0 - P1 - P2 - P3;
}

/**
 * evaluateIndividual — matches Python's Environment.evaluate() with metric='mean'.
 *
 * score = alpha * mean(P_fourPlus[mask]) + (1-alpha) * mean(P_helper[mask])
 *       - emptyPenaltyFraction * fraction(P_fourPlus[mask] < 0.2)
 *       - closePenaltyFraction * fraction(pairs closer than minDist)
 */
export const evaluateIndividual = (ind, gridX, gridY, activeMask, generation, params) => {
  const { xs, ys } = ind;
  const R = xs.length;
  const minUnitsMain = R >= 4 ? 4 : 1; // match Python: four_plus when enough recorders

  const alpha = computeAlpha(generation, params.generations, params.alphaCurve);

  let sumFour = 0, sumHelper = 0, count = 0, lowCount = 0;

  for (let i = 0; i < gridX.length; i++) {
    for (let j = 0; j < gridY.length; j++) {
      if (!isInMask(gridX[i], gridY[j], activeMask)) continue;

      const probs = recorderProbs(xs, ys, gridX[i], gridY[j], params.sd);
      const pFour   = pAtLeast(probs, minUnitsMain);
      const pHelper = pAtLeast(probs, 1);

      sumFour   += pFour;
      sumHelper += pHelper;
      if (pFour < 0.2) lowCount++;
      count++;
    }
  }

  if (count === 0) return 0;

  const meanFour   = sumFour   / count;
  const meanHelper = sumHelper / count;

  let score = alpha * meanFour + (1 - alpha) * meanHelper;

  // Empty penalty — matches Python: score -= emptyPenaltyFraction * mean(prob_map[mask] < 0.2)
  score -= params.emptyPenaltyFraction * (lowCount / count);

  // Close penalty — matches Python: score -= closePenaltyFraction * mean(dists < minDist)
  let closePairs = 0, totalPairs = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const dist = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
      if (dist < params.minDist) closePairs++;
      totalPairs++;
    }
  }
  if (totalPairs > 0) score -= params.closePenaltyFraction * (closePairs / totalPairs);

  return score;
};

/**
 * computeProbabilityMap — kept for backward compatibility with canvasRenderer.js
 */
export const computeProbabilityMap = (ind, gridX, gridY, sd) => {
  const probMap = Array(gridX.length).fill(0).map(() => Array(gridY.length).fill(0));
  for (let i = 0; i < gridX.length; i++) {
    for (let j = 0; j < gridY.length; j++) {
      let noDetProb = 1;
      for (let k = 0; k < ind.xs.length; k++) {
        const dist = Math.sqrt((gridX[i] - ind.xs[k]) ** 2 + (gridY[j] - ind.ys[k]) ** 2);
        noDetProb *= 1 - halfNormal(dist, sd);
      }
      probMap[i][j] = 1 - noDetProb;
    }
  }
  return probMap;
};