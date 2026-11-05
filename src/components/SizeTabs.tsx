import React from 'react';
import { Check } from 'lucide-react';
import { STALL_SIZE_PRESETS, type StallSizePreset } from '../types/config';

interface Props {
  activeId: string;
  onSelect: (preset: StallSizePreset) => void;
}

export const SizeTabs: React.FC<Props> = ({ activeId, onSelect }) => {
  return (
    <div className="size-bar no-scrollbar">
      <span className="size-bar-label">Stall Size</span>
      <div role="tablist" aria-label="Stall sizes" className="size-tabs">
        {STALL_SIZE_PRESETS.map((preset) => {
          const isActive = preset.id === activeId;
          return (
            <button
              key={preset.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(preset)}
              className={`size-tab${isActive ? ' is-active' : ''}`}
            >
              <span>
                {preset.widthM} × {preset.depthM} m
              </span>
              {isActive && (
                <span className="size-tab-check" aria-hidden>
                  <Check size={11} strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
