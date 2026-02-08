// components/SliderControl.jsx
import React from 'react';

export const SliderControl = ({ label, value, min, max, step, onChange }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="font-santiago text-sm text-navy-900">{label}</label>
      <span className="font-bogota text-sm font-semibold text-navy-900 bg-cream-100 px-4 py-1.5 rounded-md border border-gray-200">
        {value}
      </span>
    </div>
    <div className="relative">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
      />
      <style jsx>{`
        .slider {
          background: linear-gradient(to right, 
            #334e68 0%, 
            #334e68 ${((value - min) / (max - min)) * 100}%, 
            #e5e7eb ${((value - min) / (max - min)) * 100}%, 
            #e5e7eb 100%);
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #334e68;
          cursor: pointer;
          border: 3px solid #fef9ed;
          box-shadow: 0 2px 8px rgba(51, 78, 104, 0.3);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(51, 78, 104, 0.4);
          background: #243b53;
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #334e68;
          cursor: pointer;
          border: 3px solid #fef9ed;
          box-shadow: 0 2px 8px rgba(51, 78, 104, 0.3);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(51, 78, 104, 0.4);
          background: #243b53;
        }
      `}</style>
    </div>
  </div>
);
