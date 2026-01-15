// utils/canvasRenderer.js

import { isInMask } from './maskOperations';
import { computeProbabilityMap } from './fitnessEvaluation';

export const drawCanvas = (canvasRef, imageRef, results, params, mask, useDefaultSemicircle, image, createDefaultSemicircleMask) => {
  if (!canvasRef.current) return;

  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  const activeMask = results ? results.mask : (useDefaultSemicircle ? createDefaultSemicircleMask(params.radius) : mask);

  if (activeMask) {
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < activeMask.data.length; i++) {
      if (activeMask.data[i] === 1) {
        const x = (i % activeMask.width) / activeMask.width * width;
        const y = Math.floor(i / activeMask.width) / activeMask.height * height;
        ctx.fillRect(x, y, width / activeMask.width + 1, height / activeMask.height + 1);
      }
    }
  }

  if (image && !useDefaultSemicircle && imageRef.current) {
    ctx.globalAlpha = 0.2;
    ctx.drawImage(imageRef.current, 0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }

  if (results) {
    const probMap = computeProbabilityMap(results.best, results.gridX, results.gridY, params.sd);
    const cellWidth = width / results.gridX.length;
    const cellHeight = height / results.gridY.length;

    for (let i = 0; i < results.gridX.length; i++) {
      for (let j = 0; j < results.gridY.length; j++) {
        if (isInMask(results.gridX[i], results.gridY[j], activeMask)) {
          const prob = probMap[i][j];
          const x = (results.gridX[i] + 30) / 60 * width;
          const y = results.gridY[j] / 30 * height;
          const hue = 280 - prob * 280;
          ctx.fillStyle = `hsla(${hue}, 90%, 60%, ${prob * 0.6})`;
          ctx.fillRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);
        }
      }
    }

    for (let i = 0; i < results.best.xs.length; i++) {
      const x = (results.best.xs[i] + 30) / 60 * width;
      const y = results.best.ys[i] / 30 * height;
      
      ctx.shadowColor = 'rgba(59, 130, 246, 0.8)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(i + 1, x, y);
    }
  }
};