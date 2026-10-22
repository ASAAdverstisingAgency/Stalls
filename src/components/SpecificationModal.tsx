import React from 'react';
import type { StallConfig } from '../types/config';
import { COLOR_PALETTES } from '../types/config';
import { X, Printer } from 'lucide-react';

interface Props {
  config: StallConfig;
  previewImageUrl: string | null;
  onClose: () => void;
}

export const SpecificationModal: React.FC<Props> = ({ config, previewImageUrl, onClose }) => {
  const carpet = COLOR_PALETTES.carpets.find((c) => c.hex === config.carpetColor)?.label || 'Custom';
  const frame = COLOR_PALETTES.frames.find((f) => f.id === config.frameFinish)?.label || 'Aluminium';
  const panel = COLOR_PALETTES.panels.find((p) => p.id === config.panelFinish)?.label || 'White Melamine';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 bg-slate-50/50 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-slate-900">
              Exhibition Stall Specification Sheet
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500">
              Preliminary Client Presentation & Bill of Materials
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 text-xs sm:text-sm text-slate-700">
          {/* Render Preview Image */}
          {previewImageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img
                src={previewImageUrl}
                alt="3D Stall Render Preview"
                className="w-full h-36 sm:h-52 object-contain"
              />
            </div>
          )}

          {/* Project Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase block font-semibold">Dimensions</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                {config.width} × {config.depth} mm
              </span>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase block font-semibold">Total Height</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">{config.height} mm</span>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase block font-semibold">Floor Area</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                {((config.width * config.depth) / 1000000).toFixed(1)} m²
              </span>
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] text-slate-500 uppercase block font-semibold">Stall Type</span>
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">Modular Octanorm</span>
            </div>
          </div>

          {/* Specifications Table */}
          <div className="space-y-2">
            <h4 className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">
              Component & Material Breakdown
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-[11px] sm:text-xs">
              <div className="flex flex-col sm:flex-row justify-between p-2.5 bg-slate-50/50 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Fascia Branding Board</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.brandingText} (Height: {Math.round(config.fasciaHeight)} mm, {config.fasciaType === 'front' ? 'Front 3m' : '3-Sided 9m'})
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Octanorm Display Table</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.showTable ? '1x (1065 L × 580 D × 750 H mm, White Top & Silver Edging)' : 'None'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 bg-slate-50/50 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Visitor Seating</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.showChairs ? '2x Standard Exhibition Visitor Chairs' : 'None'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Fascia Spotlights</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.showSpotlights ? '3x Track/Clamp Exhibition Spotlights (Warm White)' : 'None'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 bg-slate-50/50 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Electrical Socket</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.showSocket ? `1x Standard Wall-Mounted Socket (${config.socketWall} wall)` : 'None'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Dustbin</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">
                  {config.showDustbin ? '1x Black Office Dustbin' : 'None'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 bg-slate-50/50 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Carpet Flooring</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">{carpet} (Full 3 × 3 m Footprint)</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Frame Structure</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">{frame} Aluminium Extrusions</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-2.5 bg-slate-50/50 gap-1 sm:gap-0">
                <span className="font-medium text-slate-600">Wall Panels</span>
                <span className="font-semibold text-slate-900 text-right sm:text-left">{panel} (Rear, Left, Right partitions)</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] sm:text-[11px] text-slate-400 italic">
            Note: This document provides preliminary client presentation specifications. Actual site installation may vary based on venue regulations.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 bg-slate-50 sticky bottom-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Specification</span>
          </button>
        </div>
      </div>
    </div>
  );
};
