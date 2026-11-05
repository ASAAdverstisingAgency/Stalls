import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { StallConfig, StallSizePreset } from './types/config';
import {
  DEFAULT_CONFIG,
  DEFAULT_STALL_SIZE_ID,
  applyStallSizePreset,
  getStallSizePreset,
} from './types/config';
import type { CameraPreset } from './services/stallScene';
import { StallScene } from './services/stallScene';
import { BottomToolbar } from './components/BottomToolbar';
import { SpecificationModal } from './components/SpecificationModal';
import { SizeTabs } from './components/SizeTabs';
import { Box, FileText, Mouse } from 'lucide-react';

function getInitialConfig(): StallConfig {
  // Boot on the first size tab (3 × 2 m)
  return applyStallSizePreset(
    { ...DEFAULT_CONFIG },
    getStallSizePreset(DEFAULT_STALL_SIZE_ID)
  );
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<StallConfig>(() => getInitialConfig());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StallScene | null>(null);

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const scene = new StallScene(canvasContainerRef.current, config);
    sceneRef.current = scene;
    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateConfig(config);
    }
  }, [config]);

  const handleConfigChange = useCallback((updates: Partial<StallConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleSizeSelect = useCallback((preset: StallSizePreset) => {
    setConfig((prev) => applyStallSizePreset(prev, preset));
    requestAnimationFrame(() => {
      sceneRef.current?.resetView();
    });
  }, []);

  const handleCameraPreset = (preset: CameraPreset) => {
    sceneRef.current?.setCameraPreset(preset);
  };

  const handleResetCamera = () => {
    sceneRef.current?.resetView();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      appContainerRef.current?.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleCaptureView = () => {
    if (!sceneRef.current) return;
    const dataUrl = sceneRef.current.captureScreenshot();
    setCapturedPreview(dataUrl);
    const link = document.createElement('a');
    link.download = `stall-presentation-${config.width}x${config.depth}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleOpenSpecs = () => {
    if (sceneRef.current) {
      setCapturedPreview(sceneRef.current.captureScreenshot());
    }
    setIsSpecsOpen(true);
  };

  const widthM = config.width / 1000;
  const depthM = config.depth / 1000;

  const specsButton = (
    <button type="button" className="btn-primary" onClick={handleOpenSpecs} title="Specifications">
      <FileText size={15} />
      <span className="btn-label-full">Specifications</span>
      <span className="btn-label-short">Specs</span>
    </button>
  );

  const sizeChip = <div className="chip chip-size">{widthM} × {depthM} m</div>;

  const colorChip = (
    <div className="chip chip-color">
      <span
        className="chip-swatch"
        style={{ backgroundColor: config.panelColor }}
        title="Panel colour"
      />
      <span className="chip-mono">{config.panelColor.toUpperCase()}</span>
    </div>
  );

  return (
    <div ref={appContainerRef} className="app-shell">
      <div className="app-top">
        <header className="app-header">
          <div className="app-brand">
            <div className="app-logo" aria-hidden>
              <Box size={19} strokeWidth={2.4} />
            </div>
            <div className="app-brand-text">
              <div className="app-title">FMCG EXPO 2027 Floor Plan 3D</div>
              <div className="app-subtitle">Interactive 3D configurator</div>
            </div>
          </div>

          <div className="app-header-actions app-header-actions-desktop">
            {sizeChip}
            {colorChip}
            {specsButton}
          </div>
        </header>

        {/* Mobile-only summary row (layout from mockup; keeps live app text/values) */}
        <div className="mobile-meta">
          {sizeChip}
          {colorChip}
          {specsButton}
        </div>

        <SizeTabs activeId={config.stallSizeId} onSelect={handleSizeSelect} />
      </div>

      <div className="viewport">
        <div className="viewport-hint">
          <span className="preview-badge">3D Preview</span>
          <span className="preview-help preview-help-full">
            <Mouse size={14} strokeWidth={2} />
            Drag to rotate • Scroll to zoom • Two-finger to pan
          </span>
          <span className="preview-help preview-help-short">
            <Mouse size={13} strokeWidth={2} />
            Drag to rotate • Pinch to zoom • Two-finger pan
          </span>
        </div>

        <div ref={canvasContainerRef} className="viewport-canvas" />

        <BottomToolbar
          onPresetSelect={handleCameraPreset}
          onReset={handleResetCamera}
          onCapture={handleCaptureView}
          isFullscreen={isFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          showDimensions={config.showDimensions}
          onToggleDimensions={() =>
            handleConfigChange({ showDimensions: !config.showDimensions })
          }
          unit={config.dimensionUnit === 'mm' ? 'mm' : config.dimensionUnit === 'ft' ? 'ft' : 'm'}
          onToggleUnit={() => {
            const order: Array<'m' | 'ft' | 'mm'> = ['m', 'ft', 'mm'];
            const idx = order.indexOf(
              config.dimensionUnit === 'mm' || config.dimensionUnit === 'ft'
                ? config.dimensionUnit
                : 'm'
            );
            handleConfigChange({ dimensionUnit: order[(idx + 1) % order.length] });
          }}
        />
      </div>

      {isSpecsOpen && (
        <SpecificationModal
          config={config}
          previewImageUrl={capturedPreview}
          onClose={() => setIsSpecsOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
