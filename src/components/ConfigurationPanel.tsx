import React, { useRef } from 'react';
import type { StallConfig } from '../types/config';
import { COLOR_PALETTES } from '../types/config';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Ruler,
  Sliders,
  Type,
  Palette,
  Armchair,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';

interface Props {
  config: StallConfig;
  onChange: (updates: Partial<StallConfig>) => void;
  onOpenSpecsModal: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ConfigurationPanel: React.FC<Props> = ({
  config,
  onChange,
  onOpenSpecsModal,
  isCollapsed,
  onToggleCollapse,
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onChange({ brandingLogoUrl: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <aside
      className={`glass-panel border-t md:border-t-0 md:border-l border-slate-200/90 bg-white shadow-2xl flex flex-col transition-all duration-300 z-30 shrink-0 ${
        /* On desktop/tab: fixed width sidebar. On mobile: bottom drawer */
        isCollapsed
          ? 'h-12 md:h-full md:w-14 overflow-hidden'
          : 'h-[60vh] md:h-full w-full md:w-[360px] lg:w-[400px] xl:w-[440px]'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/90 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-sky-100 flex items-center justify-center text-sky-600">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm tracking-wide">
              Stall Editor
            </h2>
            <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
              ● Live 3D Synchronization
            </span>
          </div>
        </div>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          className="p-1.5 rounded-lg hover:bg-slate-200/70 text-slate-600 transition cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 md:rotate-90" />
          ) : (
            <ChevronDown className="w-4 h-4 md:-rotate-90" />
          )}
        </button>
      </div>

      {/* Main Controls Scrollable Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs text-slate-700 pb-28 md:pb-8">
          {/* 1. Stall Dimensions */}
          <section className="space-y-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <Ruler className="w-4 h-4 text-sky-600" />
                <span>Stall Dimensions & Footprint</span>
              </div>
              {/* Unit Toggle: Feet vs MM */}
              <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => onChange({ dimensionUnit: 'ft' })}
                  className={`px-2 py-0.5 rounded-md transition ${
                    config.dimensionUnit === 'ft'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Feet (ft)
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ dimensionUnit: 'mm' })}
                  className={`px-2 py-0.5 rounded-md transition ${
                    config.dimensionUnit === 'mm'
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Metric (mm)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">
                  Width {config.dimensionUnit === 'ft' ? `(${(config.width / 304.8).toFixed(1)} ft)` : '(mm)'}
                </label>
                <input
                  type="number"
                  step="100"
                  min="2000"
                  max="6000"
                  value={config.width}
                  onChange={(e) => onChange({ width: Number(e.target.value) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {(config.width / 304.8).toFixed(2)} ft
                </span>
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">
                  Depth {config.dimensionUnit === 'ft' ? `(${(config.depth / 304.8).toFixed(1)} ft)` : '(mm)'}
                </label>
                <input
                  type="number"
                  step="100"
                  min="2000"
                  max="6000"
                  value={config.depth}
                  onChange={(e) => onChange({ depth: Number(e.target.value) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {(config.depth / 304.8).toFixed(2)} ft
                </span>
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">
                  Height {config.dimensionUnit === 'ft' ? `(${(config.height / 304.8).toFixed(1)} ft)` : '(mm)'}
                </label>
                <input
                  type="number"
                  step="100"
                  min="2000"
                  max="3500"
                  value={config.height}
                  onChange={(e) => onChange({ height: Number(e.target.value) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  {(config.height / 304.8).toFixed(2)} ft
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 flex justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200">
              <span>Overall Stall Footprint:</span>
              <span className="font-bold text-sky-700">
                {((config.width * config.depth) / 1000000).toFixed(1)} m² ({(((config.width / 304.8) * (config.depth / 304.8))).toFixed(1)} sq ft)
              </span>
            </div>
          </section>

          {/* 2. Fascia & Branding */}
          <section className="space-y-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">
              <Type className="w-4 h-4 text-sky-600" />
              <span>Fascia Board & Branding</span>
            </div>

            <div>
              <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Signage / Company Name</label>
              <input
                type="text"
                value={config.brandingText}
                onChange={(e) => onChange({ brandingText: e.target.value })}
                placeholder="EXPO INNOVATIONS LTD"
                className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Fascia Coverage</label>
                <select
                  value={config.fasciaType}
                  onChange={(e) => onChange({ fasciaType: e.target.value as 'front' | 'three-sided' })}
                  className="w-full mt-1 px-2 py-1.5 bg-white border border-slate-300 rounded text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="front">Front Only (3000 mm)</option>
                  <option value="three-sided">3-Sided (9000 mm Total)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold">Fascia Height (mm)</label>
                <input
                  type="number"
                  step="1"
                  value={Math.round(config.fasciaHeight)}
                  onChange={(e) => onChange({ fasciaHeight: Number(e.target.value) })}
                  className="w-full mt-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">Fascia Board Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.fasciaColor}
                    onChange={(e) => onChange({ fasciaColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="text-[11px] font-mono text-slate-700">{config.fasciaColor}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block">Text Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={config.textColor}
                    onChange={(e) => onChange({ textColor: e.target.value })}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0.5"
                  />
                  <span className="text-[11px] font-mono text-slate-700">{config.textColor}</span>
                </div>
              </div>
            </div>

            {/* Logo Upload Option */}
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-2 bg-white hover:bg-slate-50 border border-dashed border-slate-300 rounded-lg text-slate-700 text-[11px] font-medium transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-sky-600" />
                <span>Upload Brand Logo</span>
              </button>
            </div>
          </section>

          {/* 3. Finishes and Materials */}
          <section className="space-y-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">
              <Palette className="w-4 h-4 text-sky-600" />
              <span>Finishes & Materials</span>
            </div>

            {/* Carpet Color */}
            <div>
              <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block mb-1">
                Carpeted Floor Color
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PALETTES.carpets.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onChange({ carpetColor: c.hex })}
                    className={`flex flex-col items-center p-1.5 rounded-lg border text-[10px] transition cursor-pointer bg-white ${
                      config.carpetColor === c.hex
                        ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 ring-2 ring-sky-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-slate-300 mb-1"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="truncate w-full text-center">{c.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Finish */}
            <div>
              <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block mb-1">
                Octanorm Aluminium Frame
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {COLOR_PALETTES.frames.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => onChange({ frameFinish: f.id })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] transition cursor-pointer bg-white ${
                      config.frameFinish === f.id
                        ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 ring-2 ring-sky-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: f.hex }}
                    />
                    <span className="truncate">{f.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Infill Panel Finish */}
            <div>
              <label className="text-[10px] sm:text-[11px] text-slate-500 font-semibold block mb-1">
                Wall Partition Panels
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {COLOR_PALETTES.panels.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onChange({ panelFinish: p.id })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-[11px] transition cursor-pointer bg-white ${
                      config.panelFinish === p.id
                        ? 'border-sky-500 bg-sky-50 font-bold text-sky-700 ring-2 ring-sky-400'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: p.hex }}
                    />
                    <span className="truncate">{p.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 4. Furniture and Accessories */}
          <section className="space-y-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">
              <Armchair className="w-4 h-4 text-sky-600" />
              <span>Furniture & Accessories</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Octanorm Table (1065 × 580 × 750 mm)</span>
                <input
                  type="checkbox"
                  checked={config.showTable}
                  onChange={(e) => onChange({ showTable: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Two Visitor Chairs</span>
                <input
                  type="checkbox"
                  checked={config.showChairs}
                  onChange={(e) => onChange({ showChairs: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Wall Electrical Socket (1x)</span>
                <input
                  type="checkbox"
                  checked={config.showSocket}
                  onChange={(e) => onChange({ showSocket: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Exhibition Dustbin (1x)</span>
                <input
                  type="checkbox"
                  checked={config.showDustbin}
                  onChange={(e) => onChange({ showDustbin: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Front Fascia Spotlights (3x)</span>
                <input
                  type="checkbox"
                  checked={config.showSpotlights}
                  onChange={(e) => onChange({ showSpotlights: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Table Placement Slider */}
            {config.showTable && (
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-800 block">
                  Table Position (Inside Stall)
                </span>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Lateral (Left - Right)</span>
                    <span className="font-mono font-semibold text-slate-800">{config.tablePositionX} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-800"
                    max="800"
                    value={config.tablePositionX}
                    onChange={(e) => onChange({ tablePositionX: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>Depth (Back - Entrance)</span>
                    <span className="font-mono font-semibold text-slate-800">{config.tablePositionZ} mm</span>
                  </div>
                  <input
                    type="range"
                    min="-800"
                    max="1000"
                    value={config.tablePositionZ}
                    onChange={(e) => onChange({ tablePositionZ: Number(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                  />
                </div>
              </div>
            )}
          </section>

          {/* 5. Measurement Annotations */}
          <section className="space-y-3 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 border-b border-slate-200/80 pb-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>Dimension Annotations</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">Stall Dimensions (W, D, H, Fascia)</span>
                <input
                  type="checkbox"
                  checked={config.showDimensions}
                  onChange={(e) => onChange({ showDimensions: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-xs">
                <span className="font-medium text-slate-800">
                  Table Dimensions {config.dimensionUnit === 'ft' ? '(3.5 × 1.9 × 2.5 ft)' : '(1065×580×750 mm)'}
                </span>
                <input
                  type="checkbox"
                  checked={config.showFurnitureDimensions}
                  onChange={(e) => onChange({ showFurnitureDimensions: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                />
              </label>
            </div>
          </section>

          {/* Quick Specifications Modal Button */}
          <div className="pt-1">
            <button
              onClick={onOpenSpecsModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-400" />
              <span>Generate Client Specification</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
