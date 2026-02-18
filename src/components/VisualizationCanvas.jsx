// components/VisualizationCanvas.jsx
import React, { useRef, useEffect } from 'react';
import { createDefaultSemicircleMask } from '../utils/maskOperations';

/**
 * Magma colormap - converts probability (0-1) to RGB color
 * This replicates Python's matplotlib 'magma' colormap
 */
function probabilityToColor(prob) {
  if (prob <= 0) return 'rgb(0, 0, 4)';
  if (prob >= 1) return 'rgb(252, 253, 191)';
  
  if (prob < 0.13) {
    const t = prob / 0.13;
    const r = Math.floor(t * 20);
    const g = Math.floor(t * 11);
    const b = Math.floor(20 + t * 71);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (prob < 0.38) {
    const t = (prob - 0.13) / 0.25;
    const r = Math.floor(20 + t * 107);
    const g = Math.floor(11 + t * 24);
    const b = Math.floor(91 + t * 49);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (prob < 0.64) {
    const t = (prob - 0.38) / 0.26;
    const r = Math.floor(127 + t * 94);
    const g = Math.floor(35 + t * 82);
    const b = Math.floor(140 - t * 90);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (prob < 0.89) {
    const t = (prob - 0.64) / 0.25;
    const r = Math.floor(221 + t * 28);
    const g = Math.floor(117 + t * 108);
    const b = Math.floor(50 - t * 30);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (prob - 0.89) / 0.11;
    const r = Math.floor(249 + t * 3);
    const g = Math.floor(225 + t * 28);
    const b = Math.floor(20 + t * 171);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const VisualizationCanvas = ({ 
  results, 
  params, 
  mask, 
  useDefaultSemicircle, 
  image 
}) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref is null');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context is null');
      return;
    }

    try {
      // Check if we have gradient descent results with probability map
      const hasHeatmap = results?.probabilityMap && results?.gridX && results?.gridY;
      
      if (hasHeatmap) {
        console.log('Drawing COLORED heatmap (Gradient Descent)');
        drawHeatmap(ctx, canvas, results, params);
      } else {
        console.log('Drawing STANDARD view (Genetic Algorithm or no heatmap data)');
        drawStandardView(ctx, canvas, results, params, mask, useDefaultSemicircle, image, imageRef);
      }

    } catch (error) {
      console.error('Error rendering canvas:', error);
      console.error('Results:', results);
      console.error('Params:', params);
      
      // Draw error message on canvas
      ctx.fillStyle = '#fef9ed';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#dc2626'; // red
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Error rendering visualization', canvas.width / 2, canvas.height / 2);
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText('Check console for details', canvas.width / 2, canvas.height / 2 + 25);
    }
  }, [results, params.radius, params.sd, mask, useDefaultSemicircle, image]);

  /**
   * Draw colored probability heatmap (for gradient descent results)
   */
  const drawHeatmap = (ctx, canvas, results, params) => {
    const width = canvas.width;
    const height = canvas.height;
    const P = results.probabilityMap;
    const gridX = results.gridX;
    const gridY = results.gridY;
    const physicalPositions = results.physicalPositions;
    const RADIUS = results.radius;

    // Clear canvas with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    const Ny = P.length;
    const Nx = P[0].length;
    const cellWidth = width / Nx;
    const cellHeight = height / Ny;

    // Draw probability grid as colored rectangles
    for (let yi = 0; yi < Ny; yi++) {
      for (let xi = 0; xi < Nx; xi++) {
        const prob = P[yi][xi];
        
        if (prob === 0) continue; // Skip zero probability cells

        // Convert grid coordinates to canvas coordinates
        const canvasX = ((gridX[xi] + RADIUS) / (2 * RADIUS)) * width;
        const canvasY = height - ((gridY[yi] / RADIUS) * height);

        const color = probabilityToColor(prob);
        ctx.fillStyle = color;
        ctx.fillRect(canvasX - cellWidth/2, canvasY - cellHeight/2, cellWidth, cellHeight);
      }
    }

    // Draw semicircle boundary
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(width / 2, height, height, Math.PI, 0, false);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw hydrophone positions
    physicalPositions.forEach((pos, idx) => {
      const canvasX = ((pos[0] + RADIUS) / (2 * RADIUS)) * width;
      const canvasY = height - ((pos[1] / RADIUS) * height);

      // White circle with black outline (matches theme better)
      ctx.fillStyle = '#fef9ed'; // cream (keeping theme)
      ctx.strokeStyle = '#334e68'; // navy-700 (keeping theme)
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Inner circle
      ctx.fillStyle = '#334e68'; // navy-700
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Number inside circle
      ctx.fillStyle = '#fef9ed'; // cream text
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((idx + 1).toString(), canvasX, canvasY);
    });

    // Draw colorbar legend
    const legendWidth = 25;
    const legendHeight = height * 0.5;
    const legendX = width - legendWidth - 15;
    const legendY = (height - legendHeight) / 2;

    // Draw gradient
    const gradientSteps = 100;
    for (let i = 0; i < gradientSteps; i++) {
      const prob = i / (gradientSteps - 1);
      const color = probabilityToColor(prob);
      ctx.fillStyle = color;
      const y = legendY + legendHeight - (prob * legendHeight);
      ctx.fillRect(legendX, y, legendWidth, legendHeight / gradientSteps + 1);
    }

    // Colorbar outline
    ctx.strokeStyle = '#fef9ed'; // cream outline
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);

    // Colorbar labels
    ctx.fillStyle = '#fef9ed'; // cream text
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText('1.0', legendX + legendWidth + 3, legendY + 5);
    ctx.fillText('0.5', legendX + legendWidth + 3, legendY + legendHeight / 2 + 5);
    ctx.fillText('0.0', legendX + legendWidth + 3, legendY + legendHeight + 5);
    ctx.shadowBlur = 0;

    // Draw title
    ctx.fillStyle = '#fef9ed'; // cream text
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('Detection Probability P(≥4 units)', 15, 25);

    if (results.best.meanProbability !== undefined) {
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`Mean P = ${results.best.meanProbability.toFixed(4)}`, 15, 45);
    }
    ctx.shadowBlur = 0;
  };

  /**
   * Draw standard view (for genetic algorithm or when no heatmap data)
   * This is your original drawing code
   */
  const drawStandardView = (ctx, canvas, results, params, mask, useDefaultSemicircle, image, imageRef) => {
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = '#fef9ed'; // cream-50
    ctx.fillRect(0, 0, width, height);

    // Get active mask
    const activeMask = useDefaultSemicircle 
      ? createDefaultSemicircleMask(params.radius) 
      : mask;

    // Draw semicircle region
    if (useDefaultSemicircle) {
      ctx.fillStyle = '#e5e7eb'; // gray-200
      ctx.beginPath();
      ctx.arc(width / 2, height, height, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();

      // Draw semicircle border
      ctx.strokeStyle = '#9fb3c8'; // navy-300
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height, height, Math.PI, 0, false);
      ctx.stroke();
    } else if (image && imageRef.current) {
      // Draw uploaded image
      ctx.drawImage(imageRef.current, 0, 0, width, height);
    }

    // Draw microphone positions if results exist
    if (results && results.best && results.best.xs && results.best.ys) {
      const { xs, ys } = results.best;
      
      console.log('Drawing microphones:', {
        count: xs.length,
        xSample: xs.slice(0, 3),
        ySample: ys.slice(0, 3)
      });

      if (xs.length !== ys.length) {
        console.error('Mismatch in coordinate arrays:', xs.length, 'vs', ys.length);
        return;
      }

      // Draw detection range circles (optional)
      if (params.sd) {
        const pixelsPerKm = width / (2 * params.radius);
        const rangeRadius = params.sd * pixelsPerKm;

        ctx.strokeStyle = 'rgba(51, 78, 104, 0.1)'; // navy-700 with opacity
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          const y = ys[i];

          if (isNaN(x) || isNaN(y)) {
            console.error(`Invalid coordinate at index ${i}:`, x, y);
            continue;
          }

          ctx.beginPath();
          ctx.arc(x, y, rangeRadius, 0, 2 * Math.PI);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Draw microphone markers
      // Replace the markers loop in drawStandardView
      for (let i = 0; i < xs.length; i++) {
        const xPhys = xs[i];
        const yPhys = ys[i];

        if (isNaN(xPhys) || isNaN(yPhys)) continue;

        // MAP COORDINATES: Logic -> Canvas
        // x: maps -30...30 to 0...width
        // y: maps 0...30 to height...0 (flipped)
        const canvasX = ((xPhys + params.radius) / (2 * params.radius)) * width;
        const canvasY = height - ((yPhys / params.radius) * height);

        // Outer circle
        ctx.fillStyle = '#fef9ed';
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Inner circle
        ctx.fillStyle = '#334e68';
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Number
        ctx.fillStyle = '#fef9ed';
        ctx.font = 'bold 10px Inter, sans-serif';
        ctx.fillText((i + 1).toString(), canvasX, canvasY);
      }
    } else {
      // No results - draw placeholder text
      ctx.fillStyle = '#9fb3c8'; // navy-300
      ctx.font = '16px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Run optimization to see microphone placement', width / 2, height / 2);
    }
  };

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
      
      {/* Debug info */}
      {results && (
        <div className="mt-4 p-3 bg-cream-100 rounded text-xs font-mono text-navy-700">
          <div>Microphones: {results.best?.xs?.length || 0}</div>
          <div>
            Fitness: {
              results.best?.meanProbability !== undefined 
                ? results.best.meanProbability.toFixed(4)
                : results.best?.fitness?.toFixed(4) || 'N/A'
            }
          </div>
          <div>Algorithm: {results.algorithmType || 'genetic'}</div>
        </div>
      )}
    </div>
  );
};