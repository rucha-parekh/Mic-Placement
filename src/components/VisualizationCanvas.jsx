// components/VisualizationCanvas.jsx

import React, { useRef, useEffect } from 'react';
import { drawCanvas } from '../utils/canvasRenderer';
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
    drawCanvas(
      canvasRef, 
      imageRef, 
      results, 
      params, 
      mask, 
      useDefaultSemicircle, 
      image, 
      createDefaultSemicircleMask
    );
  }, [results, params.radius, mask, useDefaultSemicircle, image, params.sd]);

  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-lg">
      <h2 className="text-xl font-bold mb-5 text-stone-800">
        {results ? '🎯 Optimized Placement' : '📍 Region Preview'}
      </h2>
      <div className="relative bg-gradient-to-br from-stone-100 to-stone-50 rounded-xl overflow-hidden shadow-inner border-2 border-stone-300">
        {image && !useDefaultSemicircle && (
          <img ref={imageRef} src={image} alt="Region" className="hidden" />
        )}
        <canvas ref={canvasRef} width={800} height={400} className="w-full" />
      </div>
    </div>
  );
};