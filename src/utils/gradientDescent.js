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

  // Grid in physical km space
  const gridSizeX = 120;
  const gridSizeY = 80;
  const gridX = Array.from({ length: gridSizeX }, (_, i) => -RADIUS + (2 * RADIUS * i) / (gridSizeX - 1));
  const gridY = Array.from({ length: gridSizeY }, (_, i) => (RADIUS * i) / (gridSizeY - 1));

  function isValidPoint(x, y) {
    return isInMask(x, y, mask);
  }

  // Initialise positions inside the mask
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

  // Per-recorder detection probs at every grid point
  function computeProbabilities(recPos) {
    return Array.from({ length: gridSizeY }, (_, yi) =>
      Array.from({ length: gridSizeX }, (_, xi) => {
        const gx = gridX[xi], gy = gridY[yi];
        return recPos.map(([rx, ry]) => {
          const dist2 = (gx - rx) ** 2 + (gy - ry) ** 2;
          return Math.exp(-dist2 / (2 * sigma * sigma));
        });
      })
    );
  }

  // P(>=4 units) at each valid grid point — matches Python's four_plus
  function computePGe4(p) {
    const Ny = p.length, Nx = p[0].length, numR = p[0][0].length;
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
        if (numR < 4) { P[yi][xi] = 1 - P0 - P1 - P2; continue; } // P(>=3) fallback
        let P3 = 0;
        for (let i = 0; i < numR; i++) {
          for (let j = i + 1; j < numR; j++) {
            for (let k = j + 1; k < numR; k++) {
              let prod = probs[i] * probs[j] * probs[k];
              for (let m = 0; m < numR; m++) { if (m!==i&&m!==j&&m!==k) prod *= 1-probs[m]; }
              P3 += prod;
            }
          }
        }
        P[yi][xi] = 1 - P0 - P1 - P2 - P3;
      }
    }
    return P;
  }

  // Gradient of P(>=4) w.r.t. recorder `a` position — derived analytically
  function gradientForRecorder(a, recPos, p) {
    const Ny = p.length, Nx = p[0].length, numR = recPos.length;
    let dPx = 0, dPy = 0;
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (!isValidPoint(gridX[xi], gridY[yi])) continue;
        const gx = gridX[xi], gy = gridY[yi];
        const probs = p[yi][xi];
        const pa = probs[a];
        const dx = gx - recPos[a][0], dy = gy - recPos[a][1];
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
            for (let k = 0; k < numR; k++) { if (k!==i&&k!==j&&k!==a) prod *= 1-probs[k]; }
            P2_term2 += prod;
          }
        }

        // For P(>=4) we need P3 gradient terms
        let P3_term1 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          for (let j = i + 1; j < numR; j++) {
            if (j === a) continue;
            let prod = probs[i] * probs[j];
            for (let k = 0; k < numR; k++) { if (k!==i&&k!==j&&k!==a) prod *= 1-probs[k]; }
            P3_term1 += prod;
          }
        }
        let P3_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          for (let j = i + 1; j < numR; j++) {
            if (j === a) continue;
            for (let k = j + 1; k < numR; k++) {
              if (k === a) continue;
              let prod = probs[i] * probs[j] * probs[k];
              for (let m = 0; m < numR; m++) { if (m!==i&&m!==j&&m!==k&&m!==a) prod *= 1-probs[m]; }
              P3_term2 += prod;
            }
          }
        }

        const dP0x = -(dpax * P0_pref), dP0y = -(dpay * P0_pref);
        const dP1x = dpax * P0_pref - dpax * P1_term2;
        const dP1y = dpay * P0_pref - dpay * P1_term2;
        const dP2x = dpax * P2_term1 - dpax * P2_term2;
        const dP2y = dpay * P2_term1 - dpay * P2_term2;
        const dP3x = dpax * P3_term1 - dpax * P3_term2;
        const dP3y = dpay * P3_term1 - dpay * P3_term2;

        // d/da [P(>=4)] = -(dP0 + dP1 + dP2 + dP3)
        dPx += -(dP0x + dP1x + dP2x + dP3x);
        dPy += -(dP0y + dP1y + dP2y + dP3y);
      }
    }
    return [dPx, dPy];
  }

  function calculateClosePenalty(recPos) {
    const gradients = recPos.map(() => [0, 0]);
    for (let i = 0; i < recPos.length; i++) {
      for (let j = i + 1; j < recPos.length; j++) {
        const dx = recPos[i][0] - recPos[j][0], dy = recPos[i][1] - recPos[j][1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist && dist > 0) {
          const gradMag = -2 * closePenaltyFraction * (minDist - dist) / dist;
          gradients[i][0] += gradMag * dx; gradients[i][1] += gradMag * dy;
          gradients[j][0] -= gradMag * dx; gradients[j][1] -= gradMag * dy;
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

  // Main optimisation loop — maximises mean P(>=4) inside mask
  for (let step = 0; step < steps; step++) {
    if (step % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      setProgress(((step + 1) / steps) * 100);
    }
    const p = computeProbabilities(recPositions);
    const P = computePGe4(p);

    let sumP = 0, count = 0;
    for (let yi = 0; yi < P.length; yi++)
      for (let xi = 0; xi < P[0].length; xi++)
        if (isValidPoint(gridX[xi], gridY[yi])) { sumP += P[yi][xi]; count++; }
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

  // Final visualisation map — P(>=4), vmax=1, matches Python display exactly
  const vizNx = 200, vizNy = 120;
  const pgX = Array.from({ length: vizNx }, (_, i) => -RADIUS + (2 * RADIUS * i) / (vizNx - 1));
  const pgY = Array.from({ length: vizNy }, (_, i) => (RADIUS * i) / (vizNy - 1));
  const numRfinal = recPositions.length;

  const finalProbabilityMap = Array.from({ length: vizNy }, (_, yi) =>
    Array.from({ length: vizNx }, (_, xi) => {
      if (!isValidPoint(pgX[xi], pgY[yi])) return 0;
      const probs = recPositions.map(([rx, ry]) => {
        const dist2 = (pgX[xi] - rx) ** 2 + (pgY[yi] - ry) ** 2;
        return Math.exp(-dist2 / (2 * sigma * sigma));
      });
      let P0 = 1; for (let i = 0; i < numRfinal; i++) P0 *= 1 - probs[i];
      let P1 = 0; for (let i = 0; i < numRfinal; i++) { let p = probs[i]; for (let j = 0; j < numRfinal; j++) { if (j!==i) p *= 1-probs[j]; } P1 += p; }
      let P2 = 0; for (let i = 0; i < numRfinal; i++) for (let j=i+1; j<numRfinal; j++) { let p=probs[i]*probs[j]; for(let k=0;k<numRfinal;k++){if(k!==i&&k!==j)p*=1-probs[k];} P2+=p; }
      if (numRfinal < 4) return 1 - P0 - P1 - P2;
      let P3 = 0;
      for (let i=0;i<numRfinal;i++) for(let j=i+1;j<numRfinal;j++) for(let k=j+1;k<numRfinal;k++) {
        let p=probs[i]*probs[j]*probs[k];
        for(let m=0;m<numRfinal;m++){if(m!==i&&m!==j&&m!==k)p*=1-probs[m];}
        P3+=p;
      }
      return 1 - P0 - P1 - P2 - P3;
    })
  );

  let sumF = 0, cntF = 0;
  for (let yi = 0; yi < vizNy; yi++)
    for (let xi = 0; xi < vizNx; xi++)
      if (finalProbabilityMap[yi][xi] > 0) { sumF += finalProbabilityMap[yi][xi]; cntF++; }
  const meanProbability = cntF > 0 ? sumF / cntF : 0;

  await new Promise(resolve => setTimeout(resolve, 100));

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
    gridX: pgX,
    gridY: pgY,
    physicalPositions: recPositions.map(p => [p[0], p[1]]),
    radius: RADIUS,
    minUnits: numRfinal >= 4 ? 4 : 3,
    vmax: 1,
  });

  setIsRunning(false);
}