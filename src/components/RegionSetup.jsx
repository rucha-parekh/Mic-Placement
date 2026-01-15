// components/RegionSetup.jsx

import React from 'react';
import { Upload } from 'lucide-react';

export const RegionSetup = ({ 
  useDefaultSemicircle, 
  setUseDefaultSemicircle, 
  onImageUpload 
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border-2 border-stone-200 shadow-lg hover:shadow-xl transition-shadow">
      <h2 className="text-xl font-bold mb-5 flex items-center gap-3 text-stone-800">
        <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl">
          <Upload className="w-5 h-5 text-white" />
        </div>
        Region Setup
      </h2>
      
      <label className="flex items-center gap-3 p-4 bg-stone-50 rounded-xl cursor-pointer hover:bg-stone-100 transition-colors mb-4 border border-stone-200">
        <input
          type="checkbox"
          checked={useDefaultSemicircle}
          onChange={(e) => setUseDefaultSemicircle(e.target.checked)}
          className="w-5 h-5 accent-blue-600 cursor-pointer"
        />
        <span className="text-sm font-medium text-stone-700">Use Default Semicircle Region</span>
      </label>

      {!useDefaultSemicircle && (
        <div className="space-y-3 animate-fadeIn">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="w-full text-sm text-stone-600 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-600 file:to-indigo-600 file:text-white file:font-semibold hover:file:from-blue-700 hover:file:to-indigo-700 file:cursor-pointer file:transition-all file:shadow-md hover:file:shadow-lg"
          />
          <p className="text-xs text-stone-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="font-semibold text-amber-800">Tip:</span> Upload a binary image where white areas = valid placement zones
          </p>
        </div>
      )}
    </div>
  );
};