// components/ScaleGuideModal.jsx
import React, { useState } from 'react';
import { BookOpen, X, Download } from 'lucide-react';

export const ScaleGuideModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const downloadGuide = () => {
    const guideContent = `
ACOUSTIC ARRAY OPTIMIZER - SCALE & AREA GUIDE
==============================================

[Full content from ScaleGuideDownload.jsx]
`;
    const blob = new Blob([guideContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Acoustic_Array_Optimizer_Scale_Guide.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Trigger Button */}
      <div className="bg-cream-100 border border-cream-400 rounded-lg p-5">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-navy-700 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cream-50" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-santiago text-sm text-navy-900 mb-2">
              Need Help with Scaling?
            </h3>
            <p className="font-bogota text-xs text-navy-700 mb-4">
              Learn about region scales, coordinate systems, and setup guidelines.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsOpen(true)}
                className="bg-white hover:bg-cream-50 text-navy-700 border border-gray-300 rounded-md px-4 py-2.5 font-bogota text-sm font-medium transition-all"
              >
                View Guide
              </button>
              <button
                onClick={downloadGuide}
                className="bg-navy-700 hover:bg-navy-800 text-cream-50 rounded-md px-4 py-2.5 font-bogota text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-navy-700 text-cream-50 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6" />
                <h2 className="font-santiago text-xl">Scale & Area Guide</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-cream-50 hover:text-cream-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="space-y-8">
                {/* Section 1: Default Semicircle */}
                <section>
                  <h3 className="font-santiago text-lg text-navy-900 mb-4 pb-2 border-b-2 border-navy-200">
                    Default Semicircle Region
                  </h3>
                  <div className="bg-cream-50 rounded-lg p-6 border border-cream-300">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="font-bogota text-xs text-navy-600 mb-1">Radius</div>
                        <div className="font-mono text-lg font-semibold text-navy-900">30 km</div>
                      </div>
                      <div>
                        <div className="font-bogota text-xs text-navy-600 mb-1">Total Width</div>
                        <div className="font-mono text-lg font-semibold text-navy-900">60 km</div>
                      </div>
                      <div>
                        <div className="font-bogota text-xs text-navy-600 mb-1">Height</div>
                        <div className="font-mono text-lg font-semibold text-navy-900">30 km</div>
                      </div>
                      <div>
                        <div className="font-bogota text-xs text-navy-600 mb-1">Coverage Area</div>
                        <div className="font-mono text-lg font-semibold text-navy-900">~1,413 km²</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-gray-300">
                      <div className="font-bogota text-xs text-navy-700">
                        <strong>Scale:</strong> 1 pixel = 75 meters
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Custom Images */}
                <section>
                  <h3 className="font-santiago text-lg text-navy-900 mb-4 pb-2 border-b-2 border-navy-200">
                    Custom Image Regions
                  </h3>
                  <p className="font-bogota text-sm text-navy-700 mb-4">
                    When uploading your own region image, specify the real-world dimensions:
                  </p>
                  <ul className="space-y-2 font-bogota text-sm text-navy-700 list-disc list-inside mb-4">
                    <li><strong>Image Width (km)</strong> - Real-world width of your region</li>
                    <li><strong>Image Height (km)</strong> - Real-world height of your region</li>
                  </ul>
                  <div className="bg-cream-50 rounded-lg p-4 border border-cream-300">
                    <div className="font-bogota text-xs text-navy-700">
                      💡 The system automatically calculates coverage area and pixel scale
                    </div>
                  </div>
                </section>

                {/* Section 3: Examples */}
                <section>
                  <h3 className="font-santiago text-lg text-navy-900 mb-4 pb-2 border-b-2 border-navy-200">
                    Examples
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h4 className="font-santiago text-sm text-navy-900 mb-2">Small Harbor (2×2 km)</h4>
                      <div className="font-bogota text-xs text-navy-700 space-y-1">
                        <div>• Coverage: 4 km²</div>
                        <div>• Scale: 1 pixel = 4 meters</div>
                        <div>• Use case: Dense monitoring of small area</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h4 className="font-santiago text-sm text-navy-900 mb-2">Coastal Region (50×10 km)</h4>
                      <div className="font-bogota text-xs text-navy-700 space-y-1">
                        <div>• Coverage: 500 km²</div>
                        <div>• Scale: 1 pixel = 62.5 meters</div>
                        <div>• Use case: Linear coastal monitoring</div>
                      </div>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-gray-300">
                      <h4 className="font-santiago text-sm text-navy-900 mb-2">Large Ocean (100×100 km)</h4>
                      <div className="font-bogota text-xs text-navy-700 space-y-1">
                        <div>• Coverage: 10,000 km²</div>
                        <div>• Scale: 1 pixel = 125 meters</div>
                        <div>• Use case: Wide-area ocean monitoring</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Detection Range */}
                <section>
                  <h3 className="font-santiago text-lg text-navy-900 mb-4 pb-2 border-b-2 border-navy-200">
                    Detection Range Guidelines
                  </h3>
                  <div className="bg-cream-50 rounded-lg p-4 border border-cream-300">
                    <table className="w-full font-bogota text-sm">
                      <thead>
                        <tr className="border-b border-cream-400">
                          <th className="text-left py-2 text-navy-900">Region Size</th>
                          <th className="text-left py-2 text-navy-900">Suggested Range</th>
                        </tr>
                      </thead>
                      <tbody className="text-navy-700">
                        <tr className="border-b border-cream-300">
                          <td className="py-2">&lt; 10 km</td>
                          <td className="py-2 font-mono">3-5 km</td>
                        </tr>
                        <tr className="border-b border-cream-300">
                          <td className="py-2">10-30 km</td>
                          <td className="py-2 font-mono">5-10 km</td>
                        </tr>
                        <tr className="border-b border-cream-300">
                          <td className="py-2">30-60 km</td>
                          <td className="py-2 font-mono">10-15 km</td>
                        </tr>
                        <tr className="border-b border-cream-300">
                          <td className="py-2">60-100 km</td>
                          <td className="py-2 font-mono">15-20 km</td>
                        </tr>
                        <tr>
                          <td className="py-2">&gt; 100 km</td>
                          <td className="py-2 font-mono">20-30 km</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="font-bogota text-xs text-navy-600 mt-3">
                    <strong>Rule of thumb:</strong> Detection range should be 20-30% of your region's smallest dimension
                  </p>
                </section>

                {/* Section 5: Image Prep */}
                <section>
                  <h3 className="font-santiago text-lg text-navy-900 mb-4 pb-2 border-b-2 border-navy-200">
                    Image Preparation
                  </h3>
                  <div className="space-y-2 font-bogota text-sm text-navy-700">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-white border-2 border-gray-400 rounded flex-shrink-0 mt-0.5"></div>
                      <div>
                        <strong>White pixels</strong> = Valid placement zones
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 bg-black border-2 border-gray-400 rounded flex-shrink-0 mt-0.5"></div>
                      <div>
                        <strong>Black pixels</strong> = No-go zones (excluded)
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-cream-50 p-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={downloadGuide}
                className="bg-navy-700 hover:bg-navy-800 text-cream-50 rounded-md px-5 py-2.5 font-bogota text-sm font-medium transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Download className="w-4 h-4" />
                Download Full Guide
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white hover:bg-cream-100 text-navy-700 border border-gray-300 rounded-md px-5 py-2.5 font-bogota text-sm font-medium transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};