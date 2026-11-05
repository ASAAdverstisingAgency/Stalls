import React, { useState } from 'react';
import type { CameraPreset } from '../services/stallScene';
import {
  RotateCcw,
  Maximize,
  Minimize,
  Camera,
  Box,
  Square,
  PanelsTopLeft,
  PanelLeft,
  PanelRight,
  PanelBottom,
} from 'lucide-react';

interface Props {
  onPresetSelect: (preset: CameraPreset) => void;
  onReset: () => void;
  onCapture: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  unit: 'mm' | 'ft' | 'm';
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
  const [activePreset, setActivePreset] = useState<CameraPreset>('isometric');

  const presets: { id: CameraPreset; label: string; short: string; icon: React.ReactNode }[] = [
    { id: 'isometric', label: 'Isometric', short: 'Iso', icon: <Box /> },
    { id: 'front', label: 'Front', short: 'Front', icon: <PanelsTopLeft /> },
    { id: 'top', label: 'Top', short: 'Top', icon: <Square /> },
    { id: 'left', label: 'Left', short: 'Left', icon: <PanelLeft /> },
    { id: 'right', label: 'Right', short: 'Right', icon: <PanelRight /> },
    { id: 'back', label: 'Rear', short: 'Rear', icon: <PanelBottom /> },
  ];

  const handlePreset = (id: CameraPreset) => {
    setActivePreset(id);
    onPresetSelect(id);
  };

  const handleReset = () => {
    setActivePreset('isometric');
    onReset();
  };

  return (
    <div className="toolbar">
      <div className="toolbar-views no-scrollbar">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handlePreset(p.id)}
            className={`toolbar-btn toolbar-view-btn${activePreset === p.id ? ' is-active' : ''}`}
          >
            {p.icon}
            <span className="toolbar-label toolbar-label-full">{p.label}</span>
            <span className="toolbar-label toolbar-label-short">{p.short}</span>
          </button>
        ))}
      </div>

      <span className="toolbar-divider" aria-hidden />

      <div className="toolbar-utils">
        <button
          type="button"
          onClick={onToggleDimensions}
          title="Toggle Dimension Annotations"
          className="toolbar-btn"
        >
          <span className={`toggle-track${showDimensions ? ' is-on' : ''}`} aria-hidden>
            <span className="toggle-thumb" />
          </span>
          <span className="toolbar-label">Dimensions</span>
        </button>

        {showDimensions && (
          <button
            type="button"
            onClick={onToggleUnit}
            title="Toggle Unit: Meters / Feet / mm"
            className="unit-chip"
          >
            {unit === 'm' ? 'M' : unit === 'ft' ? 'FT' : 'MM'}
          </button>
        )}

        <button type="button" onClick={handleReset} title="Reset Camera View" className="toolbar-btn">
          <RotateCcw />
          <span className="toolbar-label">Reset</span>
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
          className="toolbar-btn"
        >
          {isFullscreen ? <Minimize /> : <Maximize />}
          <span className="toolbar-label">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
        </button>

        <button
          type="button"
          onClick={onCapture}
          title="Capture View"
          className="toolbar-btn toolbar-btn-icon toolbar-capture"
        >
          <Camera />
        </button>
      </div>
    </div>
  );
};
