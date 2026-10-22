import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { StallConfig } from './types/config';
import { DEFAULT_CONFIG } from './types/config';
import type { CameraPreset } from './services/stallScene';
import { StallScene } from './services/stallScene';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { BottomToolbar } from './components/BottomToolbar';
import { SpecificationModal } from './components/SpecificationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { Box, Info, LogOut, Sliders } from 'lucide-react';

const STORAGE_KEY = 'octanorm_stall_config_v1';
const BROADCAST_CHANNEL_NAME = 'octanorm_stall_sync_channel';

function getInitialConfig(): StallConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        showFurnitureDimensions: parsed.showFurnitureDimensions ?? true,
      };
    }
  } catch (err) {
    console.error('Failed to load saved config:', err);
  }
  return DEFAULT_CONFIG;
}

export const App: React.FC = () => {
  const [config, setConfig] = useState<StallConfig>(getInitialConfig);
  // Default panel open so admin sees all edit options immediately
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);

  // Check if current URL is the private admin path
  const isTargetingAdminUrl = (() => {
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search);
    return path.includes('/admin') || path.includes('/config') || path.includes('/edit') || search.get('admin') === 'true';
  })();

  // Session-based authentication status
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('stall_admin_authenticated') === 'true';
  });

  const [showLoginModal, setShowLoginModal] = useState<boolean>(() => {
    return isTargetingAdminUrl && sessionStorage.getItem('stall_admin_authenticated') !== 'true';
  });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const appContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<StallScene | null>(null);

  // BroadcastChannel reference for zero-latency cross-tab communication
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            setConfig((prev) => ({ ...prev, ...event.data }));
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported, falling back to localStorage events', err);
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, []);

  // Persist edits made by authenticated admin & broadcast to client views immediately
  useEffect(() => {
    if (isTargetingAdminUrl && isAuthenticated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        // Post real-time message via BroadcastChannel
        channelRef.current?.postMessage(config);
      } catch (err) {
        console.error('Failed to persist config:', err);
      }
    }
  }, [config, isTargetingAdminUrl, isAuthenticated]);

  // Synchronize state across tabs in real-time (Standard localStorage storage event fallback)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          setConfig(updated);
        } catch (err) {
          console.error('Failed to parse updated config:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize Three.js Stall Scene
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new StallScene(canvasContainerRef.current, config);
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Update scene when config changes
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateConfig(config);
    }
  }, [config]);

  const handleConfigChange = useCallback((updates: Partial<StallConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
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
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const handleCaptureView = () => {
    if (!sceneRef.current) return;
    const dataUrl = sceneRef.current.captureScreenshot();
    setCapturedPreview(dataUrl);

    // Trigger download
    const link = document.createElement('a');
    link.download = `stall-presentation-${config.width}x${config.depth}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleOpenSpecs = () => {
    if (sceneRef.current) {
      const dataUrl = sceneRef.current.captureScreenshot();
      setCapturedPreview(dataUrl);
    }
    setIsSpecsOpen(true);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('stall_admin_authenticated');
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setIsPanelCollapsed(false);
  };

  const handleLoginCancel = () => {
    setShowLoginModal(false);
    window.location.href = '/';
  };

  const canShowEditPanel = isTargetingAdminUrl && isAuthenticated;

  return (
    <div
      ref={appContainerRef}
      className="relative flex flex-col w-screen h-screen overflow-hidden bg-slate-900 select-none font-sans"
    >
      {/* Top Architectural Header Bar */}
      <header className="h-12 sm:h-14 px-3 sm:px-5 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-20 shadow-xs shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Box className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5 sm:gap-2">
              <span className="truncate">Exhibition Stall Presentation</span>
              <span className="hidden xs:inline text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                Octanorm 3D
              </span>
              {canShowEditPanel && (
                <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Admin Editor
                </span>
              )}
            </h1>
            <p className="hidden md:block text-[11px] text-slate-500 font-medium">
              Modular 3 × 3 m System • Height 2.4 m • Interactive 360° Inspection
            </p>
          </div>
        </div>

        {/* Project Summary & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-slate-700">
            <span className="text-slate-400 font-medium">Footprint:</span>
            <span className="font-semibold text-slate-800">
              {config.width} × {config.depth} mm ({((config.width * config.depth) / 1000000).toFixed(1)} m²)
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 font-medium">Fascia:</span>
            <span className="font-semibold text-sky-700">
              {config.fasciaType === 'front' ? '3000 mm Front' : '9000 mm 3-Sided'}
            </span>
          </div>

          <button
            onClick={handleOpenSpecs}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-sky-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Specifications</span>
            <span className="sm:hidden inline">Specs</span>
          </button>

          {/* Toggle Panel Button for Admin */}
          {canShowEditPanel && (
            <button
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 transition cursor-pointer"
              title="Toggle Edit Panel"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isPanelCollapsed ? 'Show Editor' : 'Hide Editor'}</span>
            </button>
          )}

          {/* Admin Logout button */}
          {canShowEditPanel && (
            <button
              onClick={handleAdminLogout}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content: Responsive 3D Viewport + Bottom Sheet / Sidebar Panel */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Interactive 3D Canvas */}
        <div className="relative flex-1 h-full w-full bg-slate-100">
          <div ref={canvasContainerRef} className="w-full h-full cursor-grab active:cursor-grabbing touch-none" />

          {/* User interaction helper overlay badge (Responsive) */}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 pointer-events-none flex flex-col gap-1 max-w-[85%]">
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-[10px] sm:text-[11px] text-white flex items-center gap-2 shadow-md">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate">Drag: 360° Rotate • Pinch/Scroll: Zoom • 2-Finger: Pan</span>
            </div>
          </div>

          {/* Bottom Toolbar with Camera Presets & Capture */}
          <BottomToolbar
            onPresetSelect={handleCameraPreset}
            onReset={handleResetCamera}
            onCapture={handleCaptureView}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            showDimensions={config.showDimensions}
            onToggleDimensions={() => handleConfigChange({ showDimensions: !config.showDimensions })}
            unit={config.dimensionUnit || 'ft'}
            onToggleUnit={() => handleConfigChange({ dimensionUnit: config.dimensionUnit === 'ft' ? 'mm' : 'ft' })}
          />
        </div>

        {/* Configuration Side Panel: strictly visible only when logged into admin */}
        {canShowEditPanel && (
          <ConfigurationPanel
            config={config}
            onChange={handleConfigChange}
            onOpenSpecsModal={handleOpenSpecs}
            isCollapsed={isPanelCollapsed}
            onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
            onSaveToClient={() => {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
                channelRef.current?.postMessage(config);
              } catch (err) {
                console.error('Failed to save config for clients:', err);
              }
            }}
          />
        )}
      </div>

      {/* Password Authentication Modal */}
      {showLoginModal && (
        <AdminLoginModal
          onSuccess={handleLoginSuccess}
          onCancel={handleLoginCancel}
        />
      )}

      {/* Specification / Client Presentation Modal */}
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
