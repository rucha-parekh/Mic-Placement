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
  const q = probs.map(p => 1 - p);

  let P0 = 1;
  for (let i = 0; i < R; i++) P0 *= q[i];
  if (minUnits <= 1) return 1 - P0;

  let P1 = 0;
  for (let i = 0; i < R; i++) {
    P1 += q[i] > 0 ? P0 * probs[i] / q[i] : probs[i];
  }
  if (minUnits <= 2) return 1 - P0 - P1;

  let P2 = 0;
  for (let i = 0; i < R; i++) {
    const ri = q[i] > 0 ? probs[i] / q[i] : probs[i];
    for (let j = i + 1; j < R; j++) {
      const rj = q[j] > 0 ? probs[j] / q[j] : probs[j];
      P2 += P0 * ri * rj;
    }
  }
  if (minUnits <= 3) return 1 - P0 - P1 - P2;

  let P3 = 0;
  for (let i = 0; i < R; i++) {
    const ri = q[i] > 0 ? probs[i] / q[i] : probs[i];
    for (let j = i + 1; j < R; j++) {
      const rj = q[j] > 0 ? probs[j] / q[j] : probs[j];
      for (let k = j + 1; k < R; k++) {
        const rk = q[k] > 0 ? probs[k] / q[k] : probs[k];
        P3 += P0 * ri * rj * rk;
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
  const minUnitsMain = R >= 4 ? 4 : 1;

  let sumFour = 0, count = 0, lowCount = 0;

  for (let i = 0; i < gridX.length; i++) {
    for (let j = 0; j < gridY.length; j++) {
      if (!isInMask(gridX[i], gridY[j], activeMask)) continue;

      const probs = recorderProbs(xs, ys, gridX[i], gridY[j], params.sd);
      const pFour = pAtLeast(probs, minUnitsMain);

      sumFour += pFour;
      if (pFour < 0.2) lowCount++;
      count++;
    }
  }

  if (count === 0) return 0;

  const meanFour = sumFour / count;

  // Both penalties are fractions of meanFour — fitness stays positive,
  // and penalties scale naturally with how good the solution already is.
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