// components/VisualizationCanvas.jsx
import React, { useRef, useEffect } from 'react';
import { createDefaultSemicircleMask } from '../utils/maskOperations';

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
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      ctx.fillStyle = '#fef9ed'; // cream-50
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get active mask
      const activeMask = useDefaultSemicircle 
        ? createDefaultSemicircleMask(params.radius) 
        : mask;

      // Draw semicircle region
      if (useDefaultSemicircle) {
        ctx.fillStyle = '#e5e7eb'; // gray-200
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height, canvas.height, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();

        // Draw semicircle border
        ctx.strokeStyle = '#9fb3c8'; // navy-300
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height, canvas.height, Math.PI, 0, false);
        ctx.stroke();
      } else if (image && imageRef.current) {
        // Draw uploaded image
        ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
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
          const pixelsPerKm = canvas.width / (2 * params.radius);
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
        for (let i = 0; i < xs.length; i++) {
          const x = xs[i];
          const y = ys[i];

          if (isNaN(x) || isNaN(y)) {
            console.error(`Invalid coordinate at index ${i}:`, x, y);
            continue;
          }

          // Outer circle (white border)
          ctx.fillStyle = '#fef9ed'; // cream
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, 2 * Math.PI);
          ctx.fill();

          // Inner circle (navy)
          ctx.fillStyle = '#334e68'; // navy-700
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, 2 * Math.PI);
          ctx.fill();

          // Microphone number
          ctx.fillStyle = '#fef9ed'; // cream text
          ctx.font = 'bold 10px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((i + 1).toString(), x, y);
        }
      } else {
        // No results - draw placeholder text
        ctx.fillStyle = '#9fb3c8'; // navy-300
        ctx.font = '16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Run optimization to see microphone placement', canvas.width / 2, canvas.height / 2);
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
      
      {/* Debug info - remove after fixing */}
      {results && (
        <div className="mt-4 p-3 bg-cream-100 rounded text-xs font-mono text-navy-700">
          <div>Microphones: {results.best?.xs?.length || 0}</div>
          <div>Fitness: {results.best?.fitness?.toFixed(4) || 'N/A'}</div>
        </div>
      )}
    </div>
  );
};