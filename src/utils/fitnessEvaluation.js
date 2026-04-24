// utils/fitnessEvaluation.js
//
// Faithful port of Python GA.ipynb fitness().
//
// Python fitness() does:
//   score = meanP(≥4) inside mask          ← pure mean probability, NO alpha blending
//   score -= penalty_weight  * low_prob_fraction   ← empty penalty
//   score -= penalty_strength * close_fraction      ← close penalty
//
// The JS version had introduced alpha-blending (mixing P(≥1) into the objective)
// which does NOT exist in the Python prototype. This was the primary reason GA
// gave poor results — it was never purely optimising the right metric.

import { isInMask } from './maskOperations';

export const halfNormal = (x, sd) => Math.exp(-x * x / (2 * sd * sd));

function recorderProbs(xs, ys, gx, gy, sd) {
  return xs.map((rx, k) => {
    const dist = Math.sqrt((gx - rx) ** 2 + (gy - ys[k]) ** 2);
    return halfNormal(dist, sd);
  });
}

// Exact inclusion-exclusion matching Python detection_probabilities()
function pAtLeast(probs, minUnits) {
  const R = probs.length;

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= (1 - probs[i]);
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
 * evaluateIndividual
 *
 * Returns { fitness, meanProbability }
 *
 *   meanProbability = mean P(≥minUnits) across mask  (what the chart shows)
 *   fitness = meanProbability − emptyPenalty − closePenalty  (what GA sorts by)
 *
 * Both are on the same 0–1 scale as GD's meanProbability, so the hybrid
 * convergence chart is continuous at the phase boundary.
 */
export const evaluateIndividual = (ind, gridX, gridY, activeMask, params) => {
  const { xs, ys } = ind;
  const R = xs.length;

  const minUnits = R >= 4 ? 4 : R >= 3 ? 3 : 1;

  let sumP = 0, count = 0, lowCount = 0;

  for (let i = 0; i < gridX.length; i++) {
    for (let j = 0; j < gridY.length; j++) {
      if (!isInMask(gridX[i], gridY[j], activeMask)) continue;
      const probs = recorderProbs(xs, ys, gridX[i], gridY[j], params.sd);
      const p = pAtLeast(probs, minUnits);
      sumP += p;
      if (p < 0.2) lowCount++;
      count++;
    }
  }

  if (count === 0) return { fitness: 0, meanProbability: 0 };

  const meanProbability = sumP / count;

  const emptyPenalty = params.emptyPenaltyFraction * (lowCount / count);

  let closePairs = 0, totalPairs = 0;
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      const dist = Math.sqrt((xs[i] - xs[j]) ** 2 + (ys[i] - ys[j]) ** 2);
      if (dist < params.minDist) closePairs++;
      totalPairs++;
    }
  }
  const closePenalty = totalPairs > 0
    ? params.closePenaltyFraction * (closePairs / totalPairs)
    : 0;

  return {
    fitness: meanProbability - emptyPenalty - closePenalty,
    meanProbability,
  };
};

/**
 * computeProbabilityMap — kept for canvasRenderer.js backward compat
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