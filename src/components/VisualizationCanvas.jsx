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
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
      <h2 className="text-lg font-semibold mb-4">
        {results ? 'Optimized Placement' : 'Region Preview'}
      </h2>
      <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10">
        {image && !useDefaultSemicircle && (
          <img ref={imageRef} src={image} alt="Region" className="hidden" />
        )}
        <canvas ref={canvasRef} width={800} height={400} className="w-full" />
      </div>
    </div>
  );
};