// utils/gradientDescent.js
// Exact JavaScript port of the Python gradient descent code provided.
//
// Internal objective: mean P(>=3) inside mask   [compute_P_ge_3]
// Main gradient:      d/da mean(P_ge_3)          [gradient_for_recorder]
// Empty penalty grad: uses full P_ge_4 gradient  [_compute_full_P_grad_for_recorder]
// Display map:        P(>=4)                      [matches Python plot]

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
  const sigma  = params.sd;
  const lr     = params.gradientLearningRate;
  const steps  = params.gradientSteps;
  const R      = params.numRecorders;
  const minDist              = params.minDist;
  const closePenaltyFraction = params.closePenaltyFraction * 100;  // matches Python *100
  const emptyPenaltyFraction = params.emptyPenaltyFraction * 10;   // matches Python *10
  const minProbThreshold     = 0.05;

  // ── Grid (matches Python: linspace(-R,R,200) x linspace(0,R,120)) ────────
  const gridSizeX = 200, gridSizeY = 120;
  const gridX = Array.from({ length: gridSizeX }, (_, i) => -RADIUS + (2*RADIUS*i)/(gridSizeX-1));
  const gridY = Array.from({ length: gridSizeY }, (_, i) => (RADIUS*i)/(gridSizeY-1));

  function isValidPoint(x, y) { return isInMask(x, y, mask); }

  // ── Initialise positions inside mask ─────────────────────────────────────
  let recPositions = [];
  if (initialCoords && initialCoords.length > 0) {
    recPositions = initialCoords.map(c => [c.x, c.y]);
    let att = 0;
    while (recPositions.length < R && att++ < 10000) {
      const pos = randomInMask(mask);
      if (isValidPoint(pos.x, pos.y)) recPositions.push([pos.x, pos.y]);
    }
  } else {
    let att = 0;
    while (recPositions.length < R && att++ < 10000) {
      const pos = randomInMask(mask);
      if (isValidPoint(pos.x, pos.y)) recPositions.push([pos.x, pos.y]);
    }
  }

  const scores = [];

  // ── compute_probabilities ─────────────────────────────────────────────────
  // Returns p[yi][xi][r] = exp(-dist2 / (2*sigma^2))
  function computeProbabilities(recPos) {
    return Array.from({ length: gridSizeY }, (_, yi) =>
      Array.from({ length: gridSizeX }, (_, xi) =>
        recPos.map(([rx, ry]) => {
          const d2 = (gridX[xi]-rx)**2 + (gridY[yi]-ry)**2;
          return Math.exp(-d2 / (2*sigma*sigma));
        })
      )
    );
  }

  // ── compute_P_ge_3 ────────────────────────────────────────────────────────
  // P(>=3 units) = 1 - P0 - P1 - P2  inside mask, 0 outside
  function computePGe3(p) {
    const Ny = p.length, Nx = p[0].length, numR = p[0][0].length;
    return Array.from({ length: Ny }, (_, yi) =>
      Array.from({ length: Nx }, (_, xi) => {
        if (!isValidPoint(gridX[xi], gridY[yi])) return 0;
        const pr = p[yi][xi];
        let P0 = 1;
        for (let i = 0; i < numR; i++) P0 *= 1 - pr[i];

        let P1 = 0;
        for (let i = 0; i < numR; i++) {
          let prod = pr[i];
          for (let j = 0; j < numR; j++) { if (j !== i) prod *= 1 - pr[j]; }
          P1 += prod;
        }

        let P2 = 0;
        for (let i = 0; i < numR; i++) {
          for (let j = i+1; j < numR; j++) {
            let prod = pr[i] * pr[j];
            for (let k = 0; k < numR; k++) { if (k!==i && k!==j) prod *= 1-pr[k]; }
            P2 += prod;
          }
        }
        return 1 - P0 - P1 - P2;
      })
    );
  }

  // ── calculate_close_penalty ───────────────────────────────────────────────
  function calculateClosePenalty(recPos) {
    const n = recPos.length;
    const grads = recPos.map(() => [0, 0]);
    for (let i = 0; i < n; i++) {
      for (let j = i+1; j < n; j++) {
        const dx = recPos[i][0]-recPos[j][0], dy = recPos[i][1]-recPos[j][1];
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < minDist && dist > 0) {
          const gm = -2 * closePenaltyFraction * (minDist - dist) / dist;
          grads[i][0] += gm*dx; grads[i][1] += gm*dy;
          grads[j][0] -= gm*dx; grads[j][1] -= gm*dy;
        }
      }
    }
    return grads;
  }

  // ── calculate_empty_penalty ───────────────────────────────────────────────
  // Returns penaltyGradP[yi][xi] = -2 * emptyPenaltyFraction * (thresh - P) where P < thresh
  function calculateEmptyPenalty(P) {
    const Ny = P.length, Nx = P[0].length;
    const penaltyGradP = Array.from({ length: Ny }, () => new Float64Array(Nx));
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (isValidPoint(gridX[xi], gridY[yi]) && P[yi][xi] < minProbThreshold) {
          penaltyGradP[yi][xi] = -2 * emptyPenaltyFraction * (minProbThreshold - P[yi][xi]);
        }
      }
    }
    return penaltyGradP;
  }

  // ── gradient_for_recorder (P_ge_3 main gradient) ─────────────────────────
  // Matches Python's gradient_for_recorder — gradient of mean P(>=3) w.r.t. recorder a
  function gradientForRecorder(a, recPos, p) {
    const Ny = p.length, Nx = p[0].length, numR = recPos.length;
    let dPx = 0, dPy = 0;
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (!isValidPoint(gridX[xi], gridY[yi])) continue;
        const pr = p[yi][xi], pa = pr[a];
        const dx = gridX[xi]-recPos[a][0], dy = gridY[yi]-recPos[a][1];
        const dpax = (dx/(sigma*sigma))*pa;
        const dpay = (dy/(sigma*sigma))*pa;

        // P0_pref = prod(1-p[j], j!=a)
        let P0_pref = 1;
        for (let i = 0; i < numR; i++) { if (i!==a) P0_pref *= 1-pr[i]; }

        // P1_term2 = sum_i!=a [ p[i] * prod(1-p[j], j!=i,j!=a) ]
        let P1_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i===a) continue;
          let prod = pr[i];
          for (let j = 0; j < numR; j++) { if (j!==i && j!==a) prod *= 1-pr[j]; }
          P1_term2 += prod;
        }

        // P2_term1 = sum_j!=a [ p[j] * prod(1-p[k], k!=a,k!=j) ]
        let P2_term1 = 0;
        for (let j = 0; j < numR; j++) {
          if (j===a) continue;
          let prod = pr[j];
          for (let k = 0; k < numR; k++) { if (k!==a && k!==j) prod *= 1-pr[k]; }
          P2_term1 += prod;
        }

        // P2_term2 = sum_{i<j, i!=a, j!=a} [ p[i]*p[j] * prod(1-p[k], k!=i,j,a) ]
        let P2_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i===a) continue;
          for (let j = i+1; j < numR; j++) {
            if (j===a) continue;
            let prod = pr[i]*pr[j];
            for (let k = 0; k < numR; k++) { if (k!==i && k!==j && k!==a) prod *= 1-pr[k]; }
            P2_term2 += prod;
          }
        }

        const dP0x = -(dpax*P0_pref), dP0y = -(dpay*P0_pref);
        const dP1x = dpax*P0_pref - dpax*P1_term2;
        const dP1y = dpay*P0_pref - dpay*P1_term2;
        const dP2x = dpax*P2_term1 - dpax*P2_term2;
        const dP2y = dpay*P2_term1 - dpay*P2_term2;

        // d/da P(>=3) = -(dP0 + dP1 + dP2)
        dPx += -(dP0x + dP1x + dP2x);
        dPy += -(dP0y + dP1y + dP2y);
      }
    }
    return [dPx, dPy];
  }

  // ── _compute_full_P_grad_for_recorder (P_ge_4 map gradient for empty penalty) ──
  // Returns [dP_x_map, dP_y_map] — per-grid-point gradient of P(>=4) w.r.t. recorder a
  // Used for chain rule: d(emptyPenalty)/d(pos_a) = sum(penaltyGradP * dP_map)
  function computeFullPGradForRecorder(a, recPos, p) {
    const Ny = p.length, Nx = p[0].length, numR = recPos.length;
    const dPx_map = Array.from({ length: Ny }, () => new Float64Array(Nx));
    const dPy_map = Array.from({ length: Ny }, () => new Float64Array(Nx));

    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        if (!isValidPoint(gridX[xi], gridY[yi])) continue;
        const pr = p[yi][xi], pa = pr[a];
        const dx = gridX[xi]-recPos[a][0], dy = gridY[yi]-recPos[a][1];
        const dpax = (dx/(sigma*sigma))*pa;
        const dpay = (dy/(sigma*sigma))*pa;

        let P0_pref = 1;
        for (let i = 0; i < numR; i++) { if (i!==a) P0_pref *= 1-pr[i]; }

        let P1_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i===a) continue;
          let prod = pr[i];
          for (let j = 0; j < numR; j++) { if (j!==i && j!==a) prod *= 1-pr[j]; }
          P1_term2 += prod;
        }

        let P2_term1 = 0;
        for (let j = 0; j < numR; j++) {
          if (j===a) continue;
          let prod = pr[j];
          for (let k = 0; k < numR; k++) { if (k!==a && k!==j) prod *= 1-pr[k]; }
          P2_term1 += prod;
        }
        let P2_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i===a) continue;
          for (let j = i+1; j < numR; j++) {
            if (j===a) continue;
            let prod = pr[i]*pr[j];
            for (let k = 0; k < numR; k++) { if (k!==i&&k!==j&&k!==a) prod *= 1-pr[k]; }
            P2_term2 += prod;
          }
        }

        // P3 terms (needed for P_ge_4 gradient)
        let P3_term1 = 0;
        for (let j = 0; j < numR; j++) {
          if (j===a) continue;
          for (let k = j+1; k < numR; k++) {
            if (k===a) continue;
            let prod = pr[j]*pr[k];
            for (let m = 0; m < numR; m++) { if (m!==a&&m!==j&&m!==k) prod *= 1-pr[m]; }
            P3_term1 += prod;
          }
        }
        let P3_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i===a) continue;
          for (let j = i+1; j < numR; j++) {
            if (j===a) continue;
            for (let k = j+1; k < numR; k++) {
              if (k===a) continue;
              let prod = pr[i]*pr[j]*pr[k];
              for (let m = 0; m < numR; m++) { if (m!==i&&m!==j&&m!==k&&m!==a) prod *= 1-pr[m]; }
              P3_term2 += prod;
            }
          }
        }

        const dP0x = -(dpax*P0_pref), dP0y = -(dpay*P0_pref);
        const dP1x = dpax*P0_pref - dpax*P1_term2;
        const dP1y = dpay*P0_pref - dpay*P1_term2;
        const dP2x = dpax*P2_term1 - dpax*P2_term2;
        const dP2y = dpay*P2_term1 - dpay*P2_term2;
        const dP3x = dpax*P3_term1 - dpax*P3_term2;
        const dP3y = dpay*P3_term1 - dpay*P3_term2;

        // d/da P(>=4) = -(dP0+dP1+dP2+dP3)
        dPx_map[yi][xi] = -(dP0x+dP1x+dP2x+dP3x);
        dPy_map[yi][xi] = -(dP0y+dP1y+dP2y+dP3y);
      }
    }
    return [dPx_map, dPy_map];
  }

  // ── project_inside_semicircle → but mask-aware ────────────────────────────
  function projectInsideMask(pos) {
    let [x, y] = pos;
    if (y < 0) y = 0;
    if (isValidPoint(x, y)) return [x, y];
    const fb = randomInMask(mask);
    return [fb.x, fb.y];
  }

  // ── Main optimisation loop ────────────────────────────────────────────────
  for (let step = 0; step < steps; step++) {
    if (step % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      setProgress(((step+1)/steps)*100);
    }

    const p = computeProbabilities(recPositions);
    const P = computePGe3(p);  // internal objective is P(>=3)

    // Mean P(>=3) for convergence tracking
    let sumP = 0, cnt = 0;
    for (let yi = 0; yi < gridSizeY; yi++)
      for (let xi = 0; xi < gridSizeX; xi++)
        if (isValidPoint(gridX[xi], gridY[yi])) { sumP += P[yi][xi]; cnt++; }
    scores.push(cnt > 0 ? sumP/cnt : 0);

    const closePenaltyGrads = calculateClosePenalty(recPositions);
    const penaltyGradP      = calculateEmptyPenalty(P);

    const totalGrads = recPositions.map(() => [0, 0]);

    for (let a = 0; a < R; a++) {
      // Main P(>=3) gradient
      const [mgx, mgy] = gradientForRecorder(a, recPositions, p);

      // Empty penalty chain rule: sum(dL/dP * dP/d_pos_a) using full P_ge_4 gradient
      const [dPx_map, dPy_map] = computeFullPGradForRecorder(a, recPositions, p);
      let epGx = 0, epGy = 0;
      for (let yi = 0; yi < gridSizeY; yi++)
        for (let xi = 0; xi < gridSizeX; xi++) {
          epGx += penaltyGradP[yi][xi] * dPx_map[yi][xi];
          epGy += penaltyGradP[yi][xi] * dPy_map[yi][xi];
        }

      totalGrads[a][0] = mgx - closePenaltyGrads[a][0] - epGx;
      totalGrads[a][1] = mgy - closePenaltyGrads[a][1] - epGy;
    }

    for (let i = 0; i < R; i++) {
      recPositions[i][0] += lr * totalGrads[i][0];
      recPositions[i][1] += lr * totalGrads[i][1];
      recPositions[i] = projectInsideMask(recPositions[i]);
    }
  }

  setProgress(100);

  // ── Final visualisation map: P(>=4), matches Python's plot ───────────────
  const vizNx = 200, vizNy = 120;
  const pgX = Array.from({ length: vizNx }, (_, i) => -RADIUS + (2*RADIUS*i)/(vizNx-1));
  const pgY = Array.from({ length: vizNy }, (_, i) => (RADIUS*i)/(vizNy-1));
  const numRf = recPositions.length;

  const finalProbabilityMap = Array.from({ length: vizNy }, (_, yi) =>
    Array.from({ length: vizNx }, (_, xi) => {
      if (!isValidPoint(pgX[xi], pgY[yi])) return 0;
      const pr = recPositions.map(([rx, ry]) => {
        const d2 = (pgX[xi]-rx)**2 + (pgY[yi]-ry)**2;
        return Math.exp(-d2/(2*sigma*sigma));
      });
      let P0 = 1; for (let i=0;i<numRf;i++) P0*=1-pr[i];
      let P1 = 0; for (let i=0;i<numRf;i++){let p=pr[i];for(let j=0;j<numRf;j++)if(j!==i)p*=1-pr[j];P1+=p;}
      let P2 = 0; for(let i=0;i<numRf;i++)for(let j=i+1;j<numRf;j++){let p=pr[i]*pr[j];for(let k=0;k<numRf;k++)if(k!==i&&k!==j)p*=1-pr[k];P2+=p;}
      if (numRf < 4) return 1-P0-P1-P2;
      let P3=0;
      for(let i=0;i<numRf;i++)for(let j=i+1;j<numRf;j++)for(let k=j+1;k<numRf;k++){
        let p=pr[i]*pr[j]*pr[k];
        for(let m=0;m<numRf;m++)if(m!==i&&m!==j&&m!==k)p*=1-pr[m];
        P3+=p;
      }
      return 1-P0-P1-P2-P3;
    })
  );

  let sumF=0, cntF=0;
  for(let yi=0;yi<vizNy;yi++)
    for(let xi=0;xi<vizNx;xi++)
      if(finalProbabilityMap[yi][xi]>0){sumF+=finalProbabilityMap[yi][xi];cntF++;}
  const meanProbability = cntF>0 ? sumF/cntF : 0;

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
    minUnits: numRf >= 4 ? 4 : 3,
    vmax: 1,
  });

  setIsRunning(false);
}