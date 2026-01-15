// components/RegionSetup.jsx

import React from 'react';
import { Upload } from 'lucide-react';

export const RegionSetup = ({ 
  useDefaultSemicircle, 
  setUseDefaultSemicircle, 
  onImageUpload 
}) => {
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700 shadow-xl">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-blue-400" />
        Region Setup
      </h2>
      
      <label className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors mb-3">
        <input
          type="checkbox"
          checked={useDefaultSemicircle}
          onChange={(e) => setUseDefaultSemicircle(e.target.checked)}
          className="w-4 h-4 accent-blue-500"
        />
        <span className="text-sm">Default Semicircle Region</span>
      </label>

      {!useDefaultSemicircle && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer file:transition-colors"
          />
          <p className="text-xs text-gray-500">Binary image: white = valid areas</p>
        </div>
      )}
    </div>
  );
};