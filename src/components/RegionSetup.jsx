// components/RegionSetup.jsx
import React from 'react';
import { Upload, Ruler } from 'lucide-react';
import { ScaleGuideDownload } from './ScaleGuideDownload';

export const RegionSetup = ({ 
  useDefaultSemicircle, 
  setUseDefaultSemicircle, 
  onImageUpload,
  params,
  setParams
}) => {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
      <h2 className="font-santiago text-xl mb-8 text-navy-900 flex items-center gap-3">
        <Upload className="w-6 h-6 text-navy-700" />
        Region Setup
      </h2>
      
      <label className="flex items-center gap-3 p-4 bg-cream-50 rounded-md cursor-pointer hover:bg-cream-100 transition-colors border border-gray-200 mb-6">
        <input
          type="checkbox"
          checked={useDefaultSemicircle}
          onChange={(e) => setUseDefaultSemicircle(e.target.checked)}
          className="w-5 h-5 text-navy-600 border-gray-300 rounded focus:ring-2 focus:ring-navy-300 cursor-pointer accent-navy-700"
        />
        <span className="font-bogota text-sm text-navy-900">Use Default Semicircle Region</span>
      </label>

      {/* Download Scale Guide */}
      <ScaleGuideDownload />

      {/* Scale Information Panel */}
      <div className="bg-cream-100 border border-cream-400 rounded-lg p-6 mb-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Ruler className="w-5 h-5 text-navy-700" />
          <h3 className="font-santiago text-sm text-navy-900">Region Scale</h3>
        </div>
        
        {useDefaultSemicircle ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-bogota text-sm text-navy-700">Semicircle Radius:</span>
              <span className="font-mono text-sm font-semibold text-navy-900 bg-white px-3 py-1 rounded border border-gray-300">
                {params.radius} km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bogota text-sm text-navy-700">Total Width:</span>
              <span className="font-mono text-sm font-semibold text-navy-900 bg-white px-3 py-1 rounded border border-gray-300">
                {params.radius * 2} km
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bogota text-sm text-navy-700">Coverage Area:</span>
              <span className="font-mono text-sm font-semibold text-navy-900 bg-white px-3 py-1 rounded border border-gray-300">
                ~{(Math.PI * params.radius * params.radius / 2).toFixed(1)} km²
              </span>
            </div>
            <p className="font-bogota text-xs text-navy-600 mt-3 pt-3 border-t border-cream-300">
              💡 Adjust "Region Radius" in Configuration to change the coverage area
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-bogota text-sm text-navy-900 block">
                Image Width (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={params.imageWidthKm || 60}
                onChange={(e) => setParams({...params, imageWidthKm: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 font-bogota text-sm border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
              />
              <p className="font-bogota text-xs text-navy-500">
                Real-world width of your image in kilometers
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-bogota text-sm text-navy-900 block">
                Image Height (km)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={params.imageHeightKm || 30}
                onChange={(e) => setParams({...params, imageHeightKm: parseFloat(e.target.value)})}
                className="w-full px-4 py-2.5 font-bogota text-sm border border-gray-300 rounded-md focus:border-navy-500 focus:ring-2 focus:ring-navy-200 focus:outline-none bg-white"
              />
              <p className="font-bogota text-xs text-navy-500">
                Real-world height of your image in kilometers
              </p>
            </div>

            <div className="bg-white rounded-md p-3 border border-gray-300">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bogota text-xs text-navy-600">Coverage Area:</span>
                <span className="font-mono text-xs font-semibold text-navy-900">
                  {((params.imageWidthKm || 60) * (params.imageHeightKm || 30)).toFixed(1)} km²
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bogota text-xs text-navy-600">Scale:</span>
                <span className="font-mono text-xs font-semibold text-navy-900">
                  1 pixel ≈ {((params.imageWidthKm || 60) / 800 * 1000).toFixed(0)} m
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!useDefaultSemicircle && (
        <div className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="w-full font-bogota text-sm text-navy-700 file:mr-4 file:py-3 file:px-4 file:rounded-md file:border-0 file:bg-navy-100 file:text-navy-800 file:font-medium hover:file:bg-navy-200 file:cursor-pointer file:transition-colors"
          />
          <div className="bg-cream-200 border border-cream-400 rounded-md p-4">
            <p className="font-bogota text-xs text-navy-800 mb-2">
              💡 <span className="font-semibold">How to prepare your image:</span>
            </p>
            <ul className="font-bogota text-xs text-navy-700 space-y-1 ml-4 list-disc">
              <li>White areas = valid placement zones</li>
              <li>Black areas = no-go zones</li>
              <li>Set width/height above to match real-world dimensions</li>
              <li>Example: 10km × 5km square → set 10 and 5 above</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};