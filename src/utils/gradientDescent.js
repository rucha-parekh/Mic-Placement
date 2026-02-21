// utils/gradientDescent.js
import { isInMask, randomInMask } from './maskOperations';

export async function runGradientDescent(
  params,
  mask,
  setProgress,
  setResults,
  setIsRunning,
  initialCoords = null
) {
  setIsRunning(true);
  setProgress(0);

  const RADIUS = params.radius;
  const sigma = params.sd;
  const lr = params.gradientLearningRate;
  const steps = params.gradientSteps;
  const R = params.numRecorders;
  const minDist = params.minDist;
  const closePenaltyFraction = params.closePenaltyFraction * 100;
  const emptyPenaltyFraction = params.emptyPenaltyFraction * 10;
  const minProbThreshold = 0.05;

  // Grid in physical km space
  const gridSizeX = 200;
  const gridSizeY = 120;
  const gridX = Array.from({ length: gridSizeX }, (_, i) => -RADIUS + (2 * RADIUS * i) / (gridSizeX - 1));
  const gridY = Array.from({ length: gridSizeY }, (_, i) => (RADIUS * i) / (gridSizeY - 1));

  // Mask validity: respects any mask (custom shape or default semicircle)
  function isValidPoint(x, y) {
    return isInMask(x, y, mask);
  }

  // Initialise positions inside the mask — all in physical km space
  let recPositions = [];

  if (initialCoords && initialCoords.length > 0) {
    recPositions = initialCoords.map(c => [c.x, c.y]);
    let attempts = 0;
    while (recPositions.length < R && attempts < 10000) {
      const pos = randomInMask(mask);
      if (isValidPoint(pos.x, pos.y)) recPositions.push([pos.x, pos.y]);
      attempts++;
    }
  } else {
    let attempts = 0;
    while (recPositions.length < R && attempts < 10000) {
      const pos = randomInMask(mask);
      if (isValidPoint(pos.x, pos.y)) recPositions.push([pos.x, pos.y]);
      attempts++;
    }
  }

  const scores = [];

  function computeProbabilities(recPos) {
    return Array.from({ length: gridSizeY }, (_, yi) =>
      Array.from({ length: gridSizeX }, (_, xi) => {
        const gx = gridX[xi];
        const gy = gridY[yi];
        return recPos.map(([rx, ry]) => {
          const dist2 = (gx - rx) ** 2 + (gy - ry) ** 2;
          return Math.exp(-dist2 / (2 * sigma * sigma));
        });
      })
    );
  }

  function computePGe3(p) {
    const Ny = p.length;
    const Nx = p[0].length;
    const numR = p[0][0].length;
    const P = Array.from({ length: Ny }, () => new Float64Array(Nx));
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (!isValidPoint(gridX[xi], gridY[yi])) continue;
        const probs = p[yi][xi];
        let P0 = 1;
        for (let i = 0; i < numR; i++) P0 *= 1 - probs[i];
        let P1 = 0;
        for (let i = 0; i < numR; i++) {
          let prod = probs[i];
          for (let j = 0; j < numR; j++) { if (j !== i) prod *= 1 - probs[j]; }
          P1 += prod;
        }
        let P2 = 0;
        for (let i = 0; i < numR; i++) {
          for (let j = i + 1; j < numR; j++) {
            let prod = probs[i] * probs[j];
            for (let k = 0; k < numR; k++) { if (k !== i && k !== j) prod *= 1 - probs[k]; }
            P2 += prod;
          }
        }
        P[yi][xi] = 1 - P0 - P1 - P2;
      }
    }
    return P;
  }

  function calculateClosePenalty(recPos) {
    const gradients = recPos.map(() => [0, 0]);
    for (let i = 0; i < recPos.length; i++) {
      for (let j = i + 1; j < recPos.length; j++) {
        const dx = recPos[i][0] - recPos[j][0];
        const dy = recPos[i][1] - recPos[j][1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist > 0) {
          const gradMag = -2 * closePenaltyFraction * (minDist - dist) / dist;
          gradients[i][0] += gradMag * dx;
          gradients[i][1] += gradMag * dy;
          gradients[j][0] -= gradMag * dx;
          gradients[j][1] -= gradMag * dy;
        }
      }
    }
    return { gradients };
  }

  function projectInsideMask(pos) {
    let [x, y] = pos;
    if (y < 0) y = 0;
    if (isValidPoint(x, y)) return [x, y];
    const fb = randomInMask(mask);
    return [fb.x, fb.y];
  }

  function gradientForRecorder(a, recPos, p) {
    const Ny = p.length;
    const Nx = p[0].length;
    const numR = recPos.length;
    let dPx = 0, dPy = 0;
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (!isValidPoint(gridX[xi], gridY[yi])) continue;
        const gx = gridX[xi];
        const gy = gridY[yi];
        const probs = p[yi][xi];
        const pa = probs[a];
        const dx = gx - recPos[a][0];
        const dy = gy - recPos[a][1];
        const dpax = (dx / (sigma * sigma)) * pa;
        const dpay = (dy / (sigma * sigma)) * pa;
        let P0_pref = 1;
        for (let i = 0; i < numR; i++) { if (i !== a) P0_pref *= 1 - probs[i]; }
        let P1_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          let prod = probs[i];
          for (let j = 0; j < numR; j++) { if (j !== i && j !== a) prod *= 1 - probs[j]; }
          P1_term2 += prod;
        }
        let P2_term1 = 0;
        for (let j = 0; j < numR; j++) {
          if (j === a) continue;
          let prod = probs[j];
          for (let k = 0; k < numR; k++) { if (k !== a && k !== j) prod *= 1 - probs[k]; }
          P2_term1 += prod;
        }
        let P2_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          for (let j = i + 1; j < numR; j++) {
            if (j === a) continue;
            let prod = probs[i] * probs[j];
            for (let k = 0; k < numR; k++) {
              if (k !== i && k !== j && k !== a) prod *= 1 - probs[k];
            }
            P2_term2 += prod;
          }
        }
        dPx += -(-(dpax * P0_pref) + dpax * P0_pref - dpax * P1_term2 + dpax * P2_term1 - dpax * P2_term2);
        dPy += -(-(dpay * P0_pref) + dpay * P0_pref - dpay * P1_term2 + dpay * P2_term1 - dpay * P2_term2);
      }
    }
    return [dPx, dPy];
  }

  // Main optimisation loop
  for (let step = 0; step < steps; step++) {
    if (step % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      setProgress(((step + 1) / steps) * 100);
    }
    const p = computeProbabilities(recPositions);
    const P = computePGe3(p);
    let sumP = 0, count = 0;
    for (let yi = 0; yi < P.length; yi++) {
      for (let xi = 0; xi < P[0].length; xi++) {
        if (isValidPoint(gridX[xi], gridY[yi])) { sumP += P[yi][xi]; count++; }
      }
    }
    scores.push(count > 0 ? sumP / count : 0);
    const { gradients: closePenaltyGrad } = calculateClosePenalty(recPositions);
    for (let i = 0; i < R; i++) {
      const [gx, gy] = gradientForRecorder(i, recPositions, p);
      recPositions[i][0] += lr * (gx - closePenaltyGrad[i][0]);
      recPositions[i][1] += lr * (gy - closePenaltyGrad[i][1]);
      recPositions[i] = projectInsideMask(recPositions[i]);
    }
  }

  setProgress(100);

  // Final probability map (P >= 1 unit) for visualisation — mask-aware
  const finalProbabilityMap = Array.from({ length: gridSizeY }, (_, yi) =>
    Array.from({ length: gridSizeX }, (_, xi) => {
      if (!isValidPoint(gridX[xi], gridY[yi])) return 0;
      let noDetProb = 1;
      for (const [rx, ry] of recPositions) {
        const dist2 = (gridX[xi] - rx) ** 2 + (gridY[yi] - ry) ** 2;
        noDetProb *= 1 - Math.exp(-dist2 / (2 * sigma * sigma));
      }
      return 1 - noDetProb;
    })
  );

  let sumFinal = 0, countFinal = 0;
  for (let yi = 0; yi < gridSizeY; yi++) {
    for (let xi = 0; xi < gridSizeX; xi++) {
      if (finalProbabilityMap[yi][xi] > 0) { sumFinal += finalProbabilityMap[yi][xi]; countFinal++; }
    }
  }
  const meanProbability = countFinal > 0 ? sumFinal / countFinal : 0;

  await new Promise(resolve => setTimeout(resolve, 100));

  // Store results — xs/ys are PHYSICAL KM COORDINATES (same format as genetic)
  setResults({
    best: {
      xs: recPositions.map(p => p[0]),
      ys: recPositions.map(p => p[1]),
      meanProbability,
      fitness: meanProbability,
    },
    scores,
    algorithmType: 'gradient',
    probabilityMap: finalProbabilityMap,
    gridX,
    gridY,
    physicalPositions: recPositions.map(p => [p[0], p[1]]),
    radius: RADIUS,
    minUnits: 3,
    vmax: 1,
  });

  setIsRunning(false);
}