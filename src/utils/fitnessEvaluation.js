// utils/fitnessEvaluation.js

import { isInMask } from './maskOperations';

export const halfNormal = (x, sd) => Math.exp(-x * x / (2 * sd * sd));

export const computeAlpha = (generation, totalGenerations, curve) => {
  if (curve === 'linear') return generation / totalGenerations;
  if (curve === 'expo') return 1 - Math.exp(-4 * generation / totalGenerations);
  return generation / totalGenerations;
};

export const computeProbabilityMap = (ind, gridX, gridY, sd) => {
  const probMap = Array(gridX.length).fill(0).map(() => Array(gridY.length).fill(0));
  
  for (let i = 0; i < gridX.length; i++) {
    for (let j = 0; j < gridY.length; j++) {
      let noDetProb = 1;
      for (let k = 0; k < ind.xs.length; k++) {
        const dist = Math.sqrt((gridX[i] - ind.xs[k]) ** 2 + (gridY[j] - ind.ys[k]) ** 2);
        noDetProb *= (1 - halfNormal(dist, sd));
      }
      probMap[i][j] = 1 - noDetProb;
    }
  }
  return probMap;
};

export const evaluateIndividual = (ind, gridX, gridY, activeMask, generation, params) => {
  const probMap = computeProbabilityMap(ind, gridX, gridY, params.sd);
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