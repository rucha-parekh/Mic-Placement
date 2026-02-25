import React, { useRef, useEffect } from 'react';
import { createDefaultSemicircleMask } from '../utils/maskOperations';

/**
 * Magma colormap — maps a normalised value t ∈ [0,1] to RGB.
 * Matches matplotlib 'magma'.
 */
function magmaColor(t) {
  if (t <= 0) return 'rgb(0,0,4)';
  if (t >= 1) return 'rgb(252,253,191)';
  if (t < 0.13) {
    const s = t / 0.13;
    return `rgb(${Math.floor(s*20)},${Math.floor(s*11)},${Math.floor(20+s*71)})`;
  } else if (t < 0.38) {
    const s = (t-0.13)/0.25;
    return `rgb(${Math.floor(20+s*107)},${Math.floor(11+s*24)},${Math.floor(91+s*49)})`;
  } else if (t < 0.64) {
    const s = (t-0.38)/0.26;
    return `rgb(${Math.floor(127+s*94)},${Math.floor(35+s*82)},${Math.floor(140-s*90)})`;
  } else if (t < 0.89) {
    const s = (t-0.64)/0.25;
    return `rgb(${Math.floor(221+s*28)},${Math.floor(117+s*108)},${Math.floor(50-s*30)})`;
  } else {
    const s = (t-0.89)/0.11;
    return `rgb(${Math.floor(249+s*3)},${Math.floor(225+s*28)},${Math.floor(20+s*171)})`;
  }
}

export const VisualizationCanvas = ({ results, params, mask, useDefaultSemicircle, image }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      if (results?.probabilityMap) {
        drawHeatmap(ctx, canvas, results, useDefaultSemicircle);
      } else {
        drawEmptyView(ctx, canvas, params, useDefaultSemicircle, image);
      }
    } catch (err) {
      console.error('Canvas render error:', err);
      const { width, height } = canvas;
      ctx.fillStyle = '#fef9ed';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#dc2626';
      ctx.font = '14px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Render error — check console', width/2, height/2);
    }
  }, [results, params.radius, params.sd, mask, useDefaultSemicircle, image]);

  function drawHeatmap(ctx, canvas, data, isDefaultSemicircle) {
    const { width, height } = canvas;
    const { probabilityMap: P, gridX, gridY, physicalPositions } = data;

    const vmax = data.vmax ?? 1;

    const xMin = gridX[0], xMax = gridX[gridX.length - 1];
    const yMin = gridY[0], yMax = gridY[gridY.length - 1];
    const toCanvasX = px => ((px - xMin) / (xMax - xMin)) * width;
    const toCanvasY = py => height - ((py - yMin) / (yMax - yMin)) * height;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const Ny = P.length;
    const Nx = P[0].length;
    const cellW = width  / (Nx - 1) + 1;
    const cellH = height / (Ny - 1) + 1;

    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        const prob = P[yi][xi];
        if (!prob || prob === 0) continue;
        const t = Math.min(prob / vmax, 1);
        ctx.fillStyle = magmaColor(t);
        const cx = toCanvasX(gridX[xi]);
        const cy = toCanvasY(gridY[yi]);
        ctx.fillRect(cx - cellW/2, cy - cellH/2, cellW, cellH);
      }
    }

    if (isDefaultSemicircle) {
      ctx.strokeStyle = 'cyan';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(width / 2, height, width / 2, Math.PI, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    physicalPositions.forEach(([px, py], idx) => {
      const cx = toCanvasX(px);
      const cy = toCanvasY(py);

      ctx.fillStyle = '#fef9ed';
      ctx.strokeStyle = '#334e68';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#334e68';
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fef9ed';
      ctx.font = 'bold 10px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), cx, cy);
    });

    // ===== COLORBAR =====
    const barW = 20;
    const barH = height * 0.55;
    const barX = width - barW - 40;
    const barY = (height - barH) / 2;
    const steps = 100;

    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      ctx.fillStyle = magmaColor(t);
      const y = barY + barH - t * barH;
      ctx.fillRect(barX, y, barW, barH / steps + 1);
    }

    ctx.strokeStyle = '#fef9ed';
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#fef9ed';
    ctx.font = 'bold 11px Inter,sans-serif';
    ctx.fillText(vmax.toFixed(2), barX + barW + 4, barY + 5);
    ctx.fillText((vmax * 0.5).toFixed(2), barX + barW + 4, barY + barH/2 + 5);
    ctx.fillText('0.00', barX + barW + 4, barY + barH + 5);

    // ===== TITLE + METRIC (FIXED) =====
    const minUnits = data.minUnits ?? (data.algorithmType === 'gradient' ? 3 : 1);
    const label = `Detection Probability P(≥${minUnits} unit${minUnits > 1 ? 's' : ''})`;

    ctx.font = 'bold 13px Inter,sans-serif';
    ctx.fillText(label, 12, 22);

    ctx.font = '11px Inter,sans-serif';

    if (data.algorithmType === 'genetic' && data.best?.fitness !== undefined) {
      ctx.fillText(`Fitness = ${data.best.fitness.toFixed(4)}`, 12, 40);
    } else if (data.algorithmType === 'gradient' && data.best?.meanProbability !== undefined) {
      ctx.fillText(`Mean P = ${data.best.meanProbability.toFixed(4)}`, 12, 40);
    }
  }

  function drawEmptyView(ctx, canvas, params, useDefaultSemicircle, image) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fef9ed';
    ctx.fillRect(0, 0, width, height);

    if (useDefaultSemicircle) {
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(width/2, height, height, Math.PI, 0, false);
      ctx.fill();
    } else if (image && imageRef.current) {
      ctx.drawImage(imageRef.current, 0, 0, width, height);
    }

    ctx.fillStyle = '#9fb3c8';
    ctx.font = '16px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Run optimization to see microphone placement', width/2, height/2);
  }

  return (
    <div className="bg-white rounded-lg p-8 border border-gray-200">
      <h2 className="font-santiago text-xl mb-8 text-navy-900">
        {results ? 'Optimized Placement' : 'Region Preview'}
      </h2>

      <div className="relative bg-cream-50 rounded-lg overflow-hidden border border-gray-200">
        {image && !useDefaultSemicircle && (
          <img ref={imageRef} src={image} alt="Region" className="hidden" />
        )}
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full"
          style={{ display: 'block' }}
        />
      </div>

      {results && (
        <div className="mt-4 p-3 bg-cream-100 rounded text-xs font-mono text-navy-700">
          <div>Microphones: {results.best?.xs?.length || 0}</div>

          {results.algorithmType === 'genetic' ? (
            <div>
              Fitness:{' '}
              {results.best?.fitness !== undefined
                ? results.best.fitness.toFixed(4)
                : 'N/A'}
            </div>
          ) : (
            <div>
              Mean P:{' '}
              {results.best?.meanProbability !== undefined
                ? results.best.meanProbability.toFixed(4)
                : 'N/A'}
            </div>
          )}

          <div>Algorithm: {results.algorithmType || 'gradient descent'}</div>
        </div>
      )}
    </div>
  );
};
