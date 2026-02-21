// components/SliderControl.jsx
import React, { useId } from 'react';

const sliderBaseStyles = `
  .app-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 8px;
    border-radius: 9999px;
    outline: none;
    cursor: pointer;
  }

  .app-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #334e68;
    cursor: pointer;
    border: 3px solid #fef9ed;
    box-shadow: 0 2px 8px rgba(51, 78, 104, 0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .app-slider::-webkit-slider-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(51, 78, 104, 0.4);
    background: #243b53;
  }

  .app-slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #334e68;
    cursor: pointer;
    border: 3px solid #fef9ed;
    box-shadow: 0 2px 8px rgba(51, 78, 104, 0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }

  .app-slider::-moz-range-thumb:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(51, 78, 104, 0.4);
    background: #243b53;
  }

  .app-slider::-moz-range-track {
    height: 8px;
    border-radius: 9999px;
    background: transparent;
  }
`;

// Inject the shared styles once into <head>
let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const tag = document.createElement('style');
  tag.setAttribute('data-slider-styles', 'true');
  tag.textContent = sliderBaseStyles;
  document.head.appendChild(tag);
}

export const SliderControl = ({ label, value, min, max, step, onChange }) => {
  ensureStyles();

  const pct = ((value - min) / (max - min)) * 100;
  const trackStyle = {
    background: `linear-gradient(to right, #334e68 0%, #334e68 ${pct}%, #e5e7eb ${pct}%, #e5e7eb 100%)`,
  };

  return (
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
          className="app-slider"
          style={trackStyle}
        />
      </div>
    </div>
  );
};