import React from 'react';
import type { CameraPreset } from '../services/stallScene';
import {
  Compass,
  RotateCcw,
  Maximize,
  Minimize,
  Camera,
  Layers,
} from 'lucide-react';

interface Props {
  onPresetSelect: (preset: CameraPreset) => void;
  onReset: () => void;
  onCapture: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  unit: 'mm' | 'ft';
  onToggleUnit: () => void;
}

export const BottomToolbar: React.FC<Props> = ({
  onPresetSelect,
  onReset,
  onCapture,
  isFullscreen,
  onToggleFullscreen,
  showDimensions,
  onToggleDimensions,
  unit,
  onToggleUnit,
}) => {
  const presets: { id: CameraPreset; label: string; short: string }[] = [
    { id: 'isometric', label: 'Isometric', short: 'Iso' },
    { id: 'front', label: 'Front', short: 'Front' },
    { id: 'top', label: 'Top View', short: 'Top' },
    { id: 'left', label: 'Left', short: 'Left' },
    { id: 'right', label: 'Right', short: 'Right' },
    { id: 'back', label: 'Rear', short: 'Rear' },
  ];

  return (
    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 w-[95%] sm:w-auto max-w-4xl flex flex-wrap items-center justify-between sm:justify-center gap-1.5 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl text-slate-700 text-xs">
      {/* Preset Camera Views: Horizontal scrollable on small mobile screens */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-full sm:max-w-none pb-1 sm:pb-0 pr-1 sm:pr-2 sm:border-r border-slate-200 no-scrollbar">
        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 px-1 hidden md:flex items-center gap-1 shrink-0">
          <Compass className="w-3.5 h-3.5" /> Views:
        </span>
        {presets.map((p) => (
          <button
            key={p.id}
            onClick={() => onPresetSelect(p.id)}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg font-medium text-slate-700 hover:bg-slate-100 hover:text-sky-700 transition active:scale-95 text-[11px] sm:text-xs whitespace-nowrap cursor-pointer shrink-0"
          >
            <span className="sm:inline hidden">{p.label}</span>
            <span className="sm:hidden inline">{p.short}</span>
          </button>
        ))}
      </div>

      {/* Utility Actions */}
      <div className="flex items-center gap-1 pl-1 ml-auto sm:ml-0 shrink-0">
        {/* Toggle Dimensions & Units */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleDimensions}
            title="Toggle Dimension Annotations"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer text-[11px] sm:text-xs ${
              showDimensions
                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dimensions</span>
          </button>

          {showDimensions && (
            <button
              onClick={onToggleUnit}
              title="Toggle Unit: Feet / mm"
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[10px] sm:text-[11px] transition"
            >
              {unit === 'ft' ? 'FT' : 'MM'}
            </button>
          )}
        </div>

        {/* Reset Camera */}
        <button
          onClick={onReset}
          title="Reset Camera View"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-100 text-slate-600 transition cursor-pointer text-[11px] sm:text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Fullscreen presentation */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg font-medium hover:bg-slate-100 text-slate-600 transition cursor-pointer text-[11px] sm:text-xs"
        >
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        {/* Capture Snapshot */}
        <button
          onClick={onCapture}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-sm transition active:scale-95 cursor-pointer text-[11px] sm:text-xs"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Capture</span>
        </button>
      </div>
    </div>
  );
};
