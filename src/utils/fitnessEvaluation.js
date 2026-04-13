// utils/fitnessEvaluation.js
//
// CHANGES FROM PREVIOUS VERSION:
//
// 4. REBALANCED EMPTY PENALTY — replaces the auto-scaling approach which
//    drove fitness negative by making the penalty larger than the reward.
//
//    The core problem: meanFour peaks at ~0.3-0.4 for 8 mics in a large region,
//    but the old penalty could reach 1.0, making every solution score negative
//    and removing all gradient for the algorithm to follow.
//
//    Fix: penalties are now expressed as a fraction of meanFour itself, so they
//    can never exceed the score they are modifying. Specifically:
//
//      emptyPenalty  = emptyPenaltyFraction  × meanFour × (lowCount / count)
//      closePenalty  = closePenaltyFraction  × meanFour × (closePairs / totalPairs)
//
//    This keeps fitness always positive, scales naturally with the actual score,
//    and still gives strong relative pressure to spread mics out.

import { isInMask } from './maskOperations';

export const halfNormal = (x, sd) => Math.exp(-x * x / (2 * sd * sd));

export const computeAlpha = (generation, totalGenerations, curve) => {
  if (curve === 'expo') return 1 - Math.exp(-4 * generation / totalGenerations);
  return generation / totalGenerations;
};

function recorderProbs(xs, ys, gx, gy, sd) {
  return xs.map((rx, k) => {
    const dist = Math.sqrt((gx - rx) ** 2 + (gy - ys[k]) ** 2);
    return halfNormal(dist, sd);
  });
}

function pAtLeast(probs, minUnits) {
  const R = probs.length;

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= (1 - probs[i]);
  if (minUnits === 1) return 1 - P0;

  let P1 = 0;
  for (let i = 0; i < R; i++) {
    let prod = probs[i];
    for (let j = 0; j < R; j++) { if (j !== i) prod *= 1 - probs[j]; }
    P1 += prod;
  }
  if (minUnits === 2) return 1 - P0 - P1;

  let P2 = 0;
  for (let i = 0; i < R; i++) {
    for (let j = i + 1; j < R; j++) {
      let prod = probs[i] * probs[j];
      for (let k = 0; k < R; k++) { if (k !== i && k !== j) prod *= 1 - probs[k]; }
      P2 += prod;
    }
  }
  if (minUnits === 3) return 1 - P0 - P1 - P2;

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
 * score = meanFour
 *       − emptyPenaltyFraction  × meanFour × (fraction of points below 0.2)
 *       − closePenaltyFraction  × meanFour × (fraction of pairs too close)
 *
 * Penalties are proportional to meanFour so fitness is always positive
 * and the algorithm always has a gradient to follow.
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

      sumFour += pFour;
      if (pFour < 0.2) lowCount++;
      count++;
    }
  }

  if (count === 0) return 0;

  const meanFour   = sumFour   / count;
  const meanHelper = sumHelper / count;

  let score = alpha * meanFour + (1 - alpha) * meanHelper;

  score -= params.emptyPenaltyFraction * (lowCount / count);

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