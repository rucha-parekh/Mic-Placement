// components/SliderControl.jsx

import React from 'react';

export const SliderControl = ({ label, value, min, max, step, onChange }) => (
  <div className="space-y-2.5">
    <div className="flex justify-between items-center">
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <span className="text-sm font-mono text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
        {value}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2.5 bg-stone-200 rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700"
      style={{
        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e7e5e4 ${((value - min) / (max - min)) * 100}%, #e7e5e4 100%)`
      }}
    />
  </div>
);