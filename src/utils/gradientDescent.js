// utils/gradientDescent.js

export async function runGradientDescent(params, mask, setProgress, setResults, setIsRunning, initialCoords = null) {
  setIsRunning(true);
  setProgress(0);

  const CANVAS_SIZE = 800;
  const RADIUS = params.radius;
  const sigma = params.sd;
  const lr = params.gradientLearningRate;
  const steps = params.gradientSteps;
  const R = params.numRecorders;
  const minDist = params.minDist;
  const closePenaltyFraction = params.closePenaltyFraction * 100;
  const emptyPenaltyFraction = params.emptyPenaltyFraction * 10;
  const minProbThreshold = 0.05;

  // Create grid
  const gridSize = 200;
  const gridX = Array.from({ length: gridSize }, (_, i) => -RADIUS + (2 * RADIUS * i) / (gridSize - 1));
  const gridY = Array.from({ length: 120 }, (_, i) => (RADIUS * i) / 119);

  // Initialize positions
  let recPositions = [];
  if (initialCoords && initialCoords.length > 0) {
    recPositions = initialCoords.map(c => [c.x, c.y]);
    while (recPositions.length < R) {
      const x = (Math.random() - 0.5) * 2 * RADIUS;
      const y = Math.random() * RADIUS;
      if (x * x + y * y <= RADIUS * RADIUS) {
        recPositions.push([x, y]);
      }
    }
  } else {
    while (recPositions.length < R) {
      const x = (Math.random() - 0.5) * 2 * RADIUS;
      const y = Math.random() * RADIUS;
      if (x * x + y * y <= RADIUS * RADIUS) {
        recPositions.push([x, y]);
      }
    }
  }

  const scores = [];

  // Helper functions
  function semicircleMask(gx, gy, radius) {
    const dist = Math.sqrt(gx * gx + gy * gy);
    return dist <= radius && gy >= 0;
  }

  function computeProbabilities(recPos) {
    const probs = Array(120).fill(null).map(() => Array(gridSize).fill(null).map(() => []));
    
    for (let yi = 0; yi < 120; yi++) {
      for (let xi = 0; xi < gridSize; xi++) {
        const gx = gridX[xi];
        const gy = gridY[yi];
        
        for (let r = 0; r < recPos.length; r++) {
          const dx = gx - recPos[r][0];
          const dy = gy - recPos[r][1];
          const dist2 = dx * dx + dy * dy;
          probs[yi][xi].push(Math.exp(-dist2 / (2 * sigma * sigma)));
        }
      }
    }
    return probs;
  }

  function computePGe3(p) {
    const Ny = p.length;
    const Nx = p[0].length;
    const numR = p[0][0].length;
    const P = Array(Ny).fill(null).map(() => Array(Nx).fill(0));

    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        const gx = gridX[xi];
        const gy = gridY[yi];
        
        if (!semicircleMask(gx, gy, RADIUS)) continue;

        const probs = p[yi][xi];
        let P0 = 1;
        for (let i = 0; i < numR; i++) {
          P0 *= (1 - probs[i]);
        }

        let P1 = 0;
        for (let i = 0; i < numR; i++) {
          let prod = probs[i];
          for (let j = 0; j < numR; j++) {
            if (j !== i) prod *= (1 - probs[j]);
          }
          P1 += prod;
        }

        let P2 = 0;
        for (let i = 0; i < numR; i++) {
          for (let j = i + 1; j < numR; j++) {
            let prod = probs[i] * probs[j];
            for (let k = 0; k < numR; k++) {
              if (k !== i && k !== j) prod *= (1 - probs[k]);
            }
            P2 += prod;
          }
        }

        P[yi][xi] = 1 - P0 - P1 - P2;
      }
    }
    return P;
  }

  function calculateClosePenalty(recPos) {
    let totalPenalty = 0;
    const gradients = Array(recPos.length).fill(null).map(() => [0, 0]);

    for (let i = 0; i < recPos.length; i++) {
      for (let j = i + 1; j < recPos.length; j++) {
        const dx = recPos[i][0] - recPos[j][0];
        const dy = recPos[i][1] - recPos[j][1];
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDist) {
          const penaltyTerm = closePenaltyFraction * (minDist - dist) ** 2;
          totalPenalty += penaltyTerm;

          const gradMag = -2 * closePenaltyFraction * (minDist - dist) / dist;
          gradients[i][0] += gradMag * dx;
          gradients[i][1] += gradMag * dy;
          gradients[j][0] -= gradMag * dx;
          gradients[j][1] -= gradMag * dy;
        }
      }
    }
    return { penalty: totalPenalty, gradients };
  }

  function calculateEmptyPenalty(P) {
    let totalPenalty = 0;
    const penaltyGradP = Array(120).fill(null).map(() => Array(gridSize).fill(0));

    for (let yi = 0; yi < 120; yi++) {
      for (let xi = 0; xi < gridSize; xi++) {
        const gx = gridX[xi];
        const gy = gridY[yi];
        
        if (semicircleMask(gx, gy, RADIUS) && P[yi][xi] < minProbThreshold) {
          const diff = minProbThreshold - P[yi][xi];
          totalPenalty += emptyPenaltyFraction * diff * diff;
          penaltyGradP[yi][xi] = -2 * emptyPenaltyFraction * diff;
        }
      }
    }
    return { penalty: totalPenalty, penaltyGradP };
  }

  function projectInsideSemicircle(pos) {
    let [x, y] = pos;
    if (y < 0) y = 0;
    const r = Math.sqrt(x * x + y * y);
    if (r > RADIUS) {
      const angle = Math.atan2(y, x);
      x = RADIUS * Math.cos(angle);
      y = RADIUS * Math.sin(angle);
    }
    return [x, y];
  }

  function gradientForRecorder(a, recPos, p) {
    const Ny = p.length;
    const Nx = p[0].length;
    const numR = recPos.length;
    let dPx = 0;
    let dPy = 0;

    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        const gx = gridX[xi];
        const gy = gridY[yi];
        
        if (!semicircleMask(gx, gy, RADIUS)) continue;

        const dx = gx - recPos[a][0];
        const dy = gy - recPos[a][1];
        const pa = p[yi][xi][a];
        const probs = p[yi][xi];

        const dpax = (dx / (sigma * sigma)) * pa;
        const dpay = (dy / (sigma * sigma)) * pa;

        // P0 term
        let P0_pref = 1;
        for (let i = 0; i < numR; i++) {
          if (i !== a) P0_pref *= (1 - probs[i]);
        }
        const dP0x = -(dpax * P0_pref);
        const dP0y = -(dpay * P0_pref);

        // P1 terms
        let P1_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          let prod = probs[i];
          for (let j = 0; j < numR; j++) {
            if (j !== i && j !== a) prod *= (1 - probs[j]);
          }
          P1_term2 += prod;
        }
        const dP1x = dpax * P0_pref - dpax * P1_term2;
        const dP1y = dpay * P0_pref - dpay * P1_term2;

        // P2 terms
        let P2_term1 = 0;
        for (let j = 0; j < numR; j++) {
          if (j === a) continue;
          let prod = probs[j];
          for (let k = 0; k < numR; k++) {
            if (k !== a && k !== j) prod *= (1 - probs[k]);
          }
          P2_term1 += prod;
        }

        let P2_term2 = 0;
        for (let i = 0; i < numR; i++) {
          if (i === a) continue;
          for (let j = i + 1; j < numR; j++) {
            if (j === a) continue;
            let prod = probs[i] * probs[j];
            for (let k = 0; k < numR; k++) {
              if (k !== i && k !== j && k !== a) prod *= (1 - probs[k]);
            }
            P2_term2 += prod;
          }
        }
        const dP2x = dpax * P2_term1 - dpax * P2_term2;
        const dP2y = dpay * P2_term1 - dpay * P2_term2;

        const totalDPx = -(dP0x + dP1x + dP2x);
        const totalDPy = -(dP0y + dP1y + dP2y);

        dPx += totalDPx;
        dPy += totalDPy;
      }
    }

    return [dPx, dPy];
  }

  // ASYNC Main optimization loop - yields control to browser every 10 steps
  for (let step = 0; step < steps; step++) {
    // Yield to browser every 10 steps to prevent freezing
    if (step % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
      setProgress(((step + 1) / steps) * 100);
    }

    const p = computeProbabilities(recPositions);
    const P = computePGe3(p);

    // Calculate mean fitness
    let sumP = 0;
    let count = 0;
    for (let yi = 0; yi < P.length; yi++) {
      for (let xi = 0; xi < P[0].length; xi++) {
        const gx = gridX[xi];
        const gy = gridY[yi];
        if (semicircleMask(gx, gy, RADIUS)) {
          sumP += P[yi][xi];
          count++;
        }
      }
    }
    const meanP = sumP / count;
    scores.push(meanP);

    // Calculate gradients
    const totalGrads = Array(R).fill(null).map(() => [0, 0]);
    const { penalty: closePenalty, gradients: closePenaltyGrad } = calculateClosePenalty(recPositions);

    for (let a = 0; a < R; a++) {
      const meanPGrad = gradientForRecorder(a, recPositions, p);
      totalGrads[a][0] = meanPGrad[0] - closePenaltyGrad[a][0];
      totalGrads[a][1] = meanPGrad[1] - closePenaltyGrad[a][1];
    }

    // Update positions
    for (let i = 0; i < R; i++) {
      recPositions[i][0] += lr * totalGrads[i][0];
      recPositions[i][1] += lr * totalGrads[i][1];
      recPositions[i] = projectInsideSemicircle(recPositions[i]);
    }
  }

  // Final progress update
  setProgress(100);

  // Small delay before setting results to ensure UI is ready
  await new Promise(resolve => setTimeout(resolve, 100));

  try {
    // Convert to canvas coordinates (matching genetic algorithm format)
    // Canvas: x goes from 0 to 800, y goes from 0 to 400
    // Physical: x goes from -RADIUS to +RADIUS, y goes from 0 to RADIUS
    const xs = recPositions.map(p => {
      // Convert from [-RADIUS, +RADIUS] to [0, 800]
      return ((p[0] + RADIUS) / (2 * RADIUS)) * CANVAS_SIZE;
    });
    const ys = recPositions.map(p => {
      // Convert from [0, RADIUS] to [400, 0] (inverted Y)
      return ((RADIUS - p[1]) / RADIUS) * (CANVAS_SIZE / 2);
    });

    console.log('Gradient Descent Complete:', {
      numPositions: recPositions.length,
      meanProbability: scores[scores.length - 1],
      xs: xs.slice(0, 3),
      ys: ys.slice(0, 3)
    });

    setResults({
      best: {
        xs,
        ys,
        meanProbability: scores[scores.length - 1]  // Not "fitness" - this is mean detection probability
      },
      scores,
      algorithmType: 'gradient'  // Flag to identify this is from gradient descent
    });
  } catch (error) {
    console.error('Error setting gradient descent results:', error);
    alert('Error displaying results. Check console for details.');
  }

  setIsRunning(false);
}