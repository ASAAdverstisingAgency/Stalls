import React from 'react';
import type { StallConfig } from '../types/config';
import { COLOR_PALETTES, STALL_SIZE_PRESETS } from '../types/config';
import {
  X,
  Printer,
  FileText,
  Box,
  ArrowUpDown,
  Maximize2,
} from 'lucide-react';

interface Props {
  config: StallConfig;
  previewImageUrl: string | null;
  onClose: () => void;
}

export const SpecificationModal: React.FC<Props> = ({
  config,
  previewImageUrl,
  onClose,
}) => {
  const carpet =
    COLOR_PALETTES.carpets.find((c) => c.hex === config.carpetColor)?.label || 'Custom';
  const frame =
    COLOR_PALETTES.frames.find((f) => f.id === config.frameFinish)?.label || 'Aluminium';
  const sizePreset =
    STALL_SIZE_PRESETS.find((p) => p.id === config.stallSizeId) ||
    STALL_SIZE_PRESETS.find(
      (p) => p.panelColor.toLowerCase() === config.panelColor.toLowerCase()
    );
  const panelLabel = sizePreset?.label || 'Custom panels';
  const widthM = config.width / 1000;
  const depthM = config.depth / 1000;
  const heightM = config.height / 1000;
  const areaM2 = widthM * depthM;

  const handlePrint = () => {
    window.print();
  };

  const rows: { component: string; specification: React.ReactNode }[] = [
    {
      component: 'Size category',
      specification: (
        <span className="spec-swatch-inline">
          <span className="spec-mini-swatch" style={{ backgroundColor: config.panelColor }} />
          {panelLabel}
        </span>
      ),
    },
    {
      component: 'Fascia branding board',
      specification: `${config.brandingText} (${config.fasciaType === 'front' ? 'Front' : '3-Sided'})`,
    },
    {
      component: 'Display table',
      specification: config.showTable ? '1 included' : 'None',
    },
    {
      component: 'Visitor seating',
      specification: config.showChairs ? '2 exhibition visitor chairs' : 'None',
    },
    {
      component: 'Fascia spotlights',
      specification: config.showSpotlights
        ? '3 track/clamp exhibition spotlights (warm white)'
        : 'None',
    },
    {
      component: 'Electrical socket',
      specification: config.showSocket
        ? `1 standard wall-mounted socket (${config.socketWall} wall)`
        : 'None',
    },
    {
      component: 'Dustbin',
      specification: config.showDustbin ? '1 black office dustbin' : 'None',
    },
    {
      component: 'Carpet flooring',
      specification: `${carpet} · ${widthM} × ${depthM} m`,
    },
    {
      component: 'Frame structure',
      specification: `${frame} aluminium`,
    },
    {
      component: 'Wall panels',
      specification: `${panelLabel} · ${config.panelColor.toUpperCase()} · Rear, left & right`,
    },
  ];

  return (
    <div className="spec-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <div className="spec-modal modal-print-container">
        {/* Header */}
        <div className="spec-header">
          <div className="spec-header-left">
            <div className="spec-header-icon">
              <FileText size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="spec-title">Stall Specifications</h3>
              <p className="spec-subtitle">Configuration overview & material breakdown</p>
            </div>
          </div>
          <button type="button" className="spec-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="spec-body">
          {/* Preview + summary cards */}
          <div className="spec-top-grid">
            <div className="spec-preview">
              {previewImageUrl ? (
                <img src={previewImageUrl} alt="3D Stall Render Preview" />
              ) : (
                <span className="spec-preview-empty">Preview unavailable</span>
              )}
            </div>

            <div className="spec-summary">
              <h4 className="spec-stall-name">
                {widthM} × {depthM} m · FMCG EXPO 2027
              </h4>
              <span className="spec-badge">Modular Octanorm</span>

              <div className="spec-cards">
                <div className="spec-card">
                  <div className="spec-card-icon">
                    <Box size={16} />
                  </div>
                  <div>
                    <div className="spec-card-label">Dimensions</div>
                    <div className="spec-card-value">
                      {widthM} × {depthM} m
                    </div>
                  </div>
                </div>

                <div className="spec-card">
                  <div className="spec-card-icon">
                    <ArrowUpDown size={16} />
                  </div>
                  <div>
                    <div className="spec-card-label">Total height</div>
                    <div className="spec-card-value">{heightM.toFixed(1)} m</div>
                  </div>
                </div>

                <div className="spec-card">
                  <div className="spec-card-icon">
                    <Maximize2 size={16} />
                  </div>
                  <div>
                    <div className="spec-card-label">Floor area</div>
                    <div className="spec-card-value">{areaM2.toFixed(0)} m²</div>
                  </div>
                </div>

                <div className="spec-card">
                  <span
                    className="spec-card-swatch"
                    style={{ backgroundColor: config.panelColor }}
                  />
                  <div>
                    <div className="spec-card-label">Panel finish</div>
                    <div className="spec-card-value spec-mono">
                      {config.panelColor.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Components table */}
          <div className="spec-table-block">
            <h4 className="spec-section-title">Components & materials</h4>
            <div className="spec-table">
              <div className="spec-table-head">
                <span>Component</span>
                <span>Specification</span>
              </div>
              {rows.map((row, i) => (
                <div
                  key={row.component}
                  className={`spec-table-row${i % 2 === 1 ? ' is-alt' : ''}`}
                >
                  <span className="spec-table-component">{row.component}</span>
                  <span className="spec-table-value">{row.specification}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: note left, actions right */}
        <div className="spec-footer">
          <p className="spec-note">
            Preliminary specifications. Final installation may vary by venue.
          </p>
          <div className="spec-footer-actions">
            <button type="button" className="spec-btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="spec-btn-primary" onClick={handlePrint}>
              <Printer size={15} />
              Print Specifications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
