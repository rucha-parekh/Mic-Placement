// components/CoordinateGuide.jsx
// An inline SVG diagram that shows users exactly how the coordinate system
// maps to the semicircle, with example positions and axis labels.

import React, { useState } from 'react';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';

export const CoordinateGuide = ({ params }) => {
  const [open, setOpen] = useState(false);
  const radius = params?.radius ?? 30;

  // SVG viewport
  const W = 320, H = 180;
  const cx = W / 2;      // canvas centre-x (corresponds to x=0)
  const cy = H - 20;     // canvas bottom edge (corresponds to y=0)
  const scale = (W * 0.44) / radius; // pixels per km

  const toSvgX = (km) => cx + km * scale;
  const toSvgY = (km) => cy - km * scale;

  // Example mic positions spread across the semicircle
  const examples = [
    { x: 0,            y: radius * 0.75, label: `(0, ${(radius * 0.75).toFixed(0)})`,  desc: 'top centre' },
    { x: -radius * 0.5, y: radius * 0.5,  label: `(−${(radius*0.5).toFixed(0)}, ${(radius*0.5).toFixed(0)})`, desc: 'left mid' },
    { x:  radius * 0.5, y: radius * 0.5,  label: `(${(radius*0.5).toFixed(0)}, ${(radius*0.5).toFixed(0)})`,  desc: 'right mid' },
    { x: -radius * 0.65, y: radius * 0.2, label: `(−${(radius*0.65).toFixed(0)}, ${(radius*0.2).toFixed(0)})`, desc: 'lower left' },
    { x:  radius * 0.65, y: radius * 0.2, label: `(${(radius*0.65).toFixed(0)}, ${(radius*0.2).toFixed(0)})`,  desc: 'lower right' },
  ];

  // Semicircle arc path
  const arcR = radius * scale;
  // SVG arc: start at left edge (cx - arcR, cy), sweep to right edge (cx + arcR, cy)
  const arcPath = `M ${cx - arcR} ${cy} A ${arcR} ${arcR} 0 0 1 ${cx + arcR} ${cy}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-cream-50 transition-colors"
      >
        <span className="flex items-center gap-3 font-santiago text-sm text-navy-900">
          <Map className="w-5 h-5 text-navy-600" />
          Coordinate System Guide
        </span>
        {open
          ? <ChevronUp className="w-4 h-4 text-navy-500" />
          : <ChevronDown className="w-4 h-4 text-navy-500" />}
      </button>

      {open && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-100">

          {/* SVG diagram */}
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full rounded-lg bg-gray-900 mt-4"
            style={{ maxHeight: 200 }}
          >
            {/* Grid lines */}
            {[-radius * 0.5, 0, radius * 0.5].map(gx => (
              <line
                key={`vg-${gx}`}
                x1={toSvgX(gx)} y1={toSvgY(0)}
                x2={toSvgX(gx)} y2={toSvgY(radius)}
                stroke="#334e68" strokeWidth="0.5" strokeDasharray="3,3"
              />
            ))}
            {[radius * 0.25, radius * 0.5, radius * 0.75].map(gy => (
              <line
                key={`hg-${gy}`}
                x1={toSvgX(-radius)} y1={toSvgY(gy)}
                x2={toSvgX(radius)}  y2={toSvgY(gy)}
                stroke="#334e68" strokeWidth="0.5" strokeDasharray="3,3"
              />
            ))}

            {/* Semicircle fill */}
            <path d={`${arcPath} Z`} fill="#1a2e42" stroke="none" />

            {/* Semicircle border */}
            <path d={arcPath} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="5,3" />

            {/* Baseline */}
            <line
              x1={toSvgX(-radius)} y1={cy}
              x2={toSvgX(radius)}  y2={cy}
              stroke="#06b6d4" strokeWidth="1.5"
            />

            {/* X axis ticks & labels */}
            {[-radius, -radius / 2, 0, radius / 2, radius].map(v => (
              <g key={`xt-${v}`}>
                <line
                  x1={toSvgX(v)} y1={cy - 4}
                  x2={toSvgX(v)} y2={cy + 4}
                  stroke="#9fb3c8" strokeWidth="1"
                />
                <text
                  x={toSvgX(v)} y={cy + 13}
                  textAnchor="middle"
                  fontSize="8" fill="#9fb3c8"
                  fontFamily="monospace"
                >
                  {v}
                </text>
              </g>
            ))}

            {/* Y axis ticks & labels */}
            {[radius / 4, radius / 2, radius * 3 / 4].map(v => (
              <g key={`yt-${v}`}>
                <line
                  x1={toSvgX(-radius) - 4} y1={toSvgY(v)}
                  x2={toSvgX(-radius) + 4} y2={toSvgY(v)}
                  stroke="#9fb3c8" strokeWidth="1"
                />
                <text
                  x={toSvgX(-radius) - 7} y={toSvgY(v) + 3}
                  textAnchor="end"
                  fontSize="8" fill="#9fb3c8"
                  fontFamily="monospace"
                >
                  {Math.round(v)}
                </text>
              </g>
            ))}

            {/* Axis labels */}
            <text x={W / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#627d98" fontFamily="sans-serif">
              x (km)  →  negative = left,  positive = right
            </text>
            <text
              x={8} y={toSvgY(radius / 2)}
              textAnchor="middle" fontSize="8" fill="#627d98" fontFamily="sans-serif"
              transform={`rotate(-90, 8, ${toSvgY(radius / 2)})`}
            >
              y (km)
            </text>

            {/* Origin dot */}
            <circle cx={cx} cy={cy} r="2.5" fill="#f97316" />
            <text x={cx + 5} y={cy - 5} fontSize="8" fill="#f97316" fontFamily="monospace">(0, 0)</text>

            {/* Example mic positions */}
            {examples.map((e, i) => {
              const sx = toSvgX(e.x), sy = toSvgY(e.y);
              const dist = Math.sqrt(e.x ** 2 + e.y ** 2);
              if (dist > radius) return null; // safety
              return (
                <g key={i}>
                  <circle cx={sx} cy={sy} r="5" fill="#fef9ed" stroke="#334e68" strokeWidth="1.5" />
                  <circle cx={sx} cy={sy} r="3.5" fill="#334e68" />
                  <text cx={sx} cy={sy} textAnchor="middle" dominantBaseline="middle"
                    fontSize="6" fill="#fef9ed" fontFamily="sans-serif" x={sx} y={sy + 0.5}>
                    {i + 1}
                  </text>
                  {/* Label — offset to avoid overlap */}
                  <text
                    x={sx + (e.x < 0 ? -7 : 7)}
                    y={sy - 6}
                    textAnchor={e.x < 0 ? 'end' : 'start'}
                    fontSize="7" fill="#e2e8f0" fontFamily="monospace"
                  >
                    {e.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Rules summary */}
          <div className="bg-cream-100 rounded-md p-4 space-y-2">
            <p className="font-bogota text-xs font-semibold text-navy-900 mb-1">Valid coordinate ranges:</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span className="font-bogota text-xs text-navy-700">X range:</span>
              <span className="font-mono text-xs text-navy-900">−{radius} to +{radius} km</span>
              <span className="font-bogota text-xs text-navy-700">Y range:</span>
              <span className="font-mono text-xs text-navy-900">0 to {radius} km</span>
              <span className="font-bogota text-xs text-navy-700">Constraint:</span>
              <span className="font-mono text-xs text-navy-900">x² + y² ≤ {radius}²</span>
            </div>
            <div className="pt-2 border-t border-cream-300 space-y-1">
              <p className="font-bogota text-xs text-navy-600">
                <span className="font-semibold">Left side:</span> negative x (e.g. −15, 10)
              </p>
              <p className="font-bogota text-xs text-navy-600">
                <span className="font-semibold">Right side:</span> positive x (e.g. 15, 10)
              </p>
              <p className="font-bogota text-xs text-navy-600">
                <span className="font-semibold">Bottom edge:</span> y = 0 (the flat diameter)
              </p>
              <p className="font-bogota text-xs text-navy-600">
                <span className="font-semibold">Top / arc:</span> y up to {radius} km
              </p>
            </div>
          </div>

          {/* Colour / score tip */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
            <p className="font-bogota text-xs font-semibold text-amber-900 mb-1">💡 Why do mics look dark / purple?</p>
            <p className="font-bogota text-xs text-amber-800 leading-relaxed">
              The heatmap shows <span className="font-semibold">P(≥4 units detected simultaneously)</span>.
              For this to be yellow/high near a mic, ALL 4 mics must be within roughly{' '}
              <span className="font-mono font-semibold">{params?.sd ?? 10} km</span> (the SD parameter) of that point.
              If mics are spread more than ~{((params?.sd ?? 10) * 1.5).toFixed(0)} km apart, the overlap region shrinks
              and peak probability drops — even right next to a mic.
              Try placing mics closer together, or increase the SD parameter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};