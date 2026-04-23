import { isInMask } from './maskOperations';
import { computeProbabilityMap } from './fitnessEvaluation';

export const drawCanvas = (
  canvasRef,
  imageRef,
  results,
  params,
  mask,
  useDefaultSemicircle,
  image,
  createDefaultSemicircleMask
) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = '#fafaf9';
  ctx.fillRect(0, 0, width, height);

  const activeMask = results
    ? results.mask
    : (useDefaultSemicircle
        ? createDefaultSemicircleMask(params.radius)
        : mask);

  if (!activeMask) return;

  // 🔥 VIEWPORT (decoupled from image size)
  const viewW = params.viewWidthKm ?? params.imageWidthKm ?? 60;
  const viewH = params.viewHeightKm ?? params.imageHeightKm ?? 30;

  // 🔥 WORLD → CANVAS TRANSFORM (SINGLE SOURCE OF TRUTH)
  const worldToCanvas = (x, y) => {
    const cx = ((x + viewW / 2) / viewW) * width;
    const cy = (y / viewH) * height;
    return [cx, cy];
  };

  // =========================
  // DRAW MASK
  // =========================
  ctx.fillStyle = '#e7e5e4';

  for (let i = 0; i < activeMask.data.length; i++) {
    if (activeMask.data[i] === 1) {
      const col = i % activeMask.width;
      const row = Math.floor(i / activeMask.width);

      const xWorld =
        activeMask.xMin +
        (col / activeMask.width) * (activeMask.xMax - activeMask.xMin);

      const yWorld =
        activeMask.yMin +
        (row / activeMask.height) * (activeMask.yMax - activeMask.yMin);

      const [x, y] = worldToCanvas(xWorld, yWorld);

      const cellW = width / activeMask.width;
      const cellH = height / activeMask.height;

      ctx.fillRect(x, y, cellW + 1, cellH + 1);
    }
  }

  // =========================
  // DRAW IMAGE (aligned with world)
  // =========================
  if (image && !useDefaultSemicircle && imageRef.current) {
    ctx.globalAlpha = 0.3;

    const [x0, y0] = worldToCanvas(activeMask.xMin, activeMask.yMin);
    const [x1, y1] = worldToCanvas(activeMask.xMax, activeMask.yMax);

    const drawWidth = x1 - x0;
    const drawHeight = y1 - y0;

    ctx.drawImage(imageRef.current, x0, y0, drawWidth, drawHeight);

    ctx.globalAlpha = 1.0;
  }

  // =========================
  // DRAW RESULTS
  // =========================
  if (results) {
    const probMap = computeProbabilityMap(
      results.best,
      results.gridX,
      results.gridY,
      params.sd
    );

    const cellWidth = width / results.gridX.length;
    const cellHeight = height / results.gridY.length;

    for (let i = 0; i < results.gridX.length; i++) {
      for (let j = 0; j < results.gridY.length; j++) {
        if (isInMask(results.gridX[i], results.gridY[j], activeMask)) {
          const prob = probMap[i][j];

          const [x, y] = worldToCanvas(
            results.gridX[i],
            results.gridY[j]
          );

          const hue = 280 - prob * 280;
          ctx.fillStyle = `hsla(${hue}, 70%, 65%, ${prob * 0.5})`;

          ctx.fillRect(
            x - cellWidth / 2,
            y - cellHeight / 2,
            cellWidth,
            cellHeight
          );
        }
      }
    }

    // =========================
    // DRAW SENSORS (FIXED BUG)
    // =========================
    for (let i = 0; i < results.best.xs.length; i++) {
      const [x, y] = worldToCanvas(
        results.best.xs[i],
        results.best.ys[i]
      );

      ctx.shadowColor = 'rgba(59, 130, 246, 0.6)';
      ctx.shadowBlur = 12;

      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, x, y);
    }
  }
};