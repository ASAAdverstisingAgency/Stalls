export interface StallConfig {
  // Active size preset id (matches legend tabs)
  stallSizeId: string;

  // Dimensions in millimeters
  width: number;
  depth: number;
  height: number;

  // Fascia
  fasciaType: 'front' | 'three-sided';
  fasciaHeight: number; // 228.6 mm (9 inches)
  fasciaColor: string;
  brandingText: string;
  brandingLogoUrl: string | null;
  textColor: string;

  // Finishes
  carpetColor: string;
  frameFinish: string;
  /** Wall panel fill — set from size legend colors */
  panelColor: string;
  panelFinish: string;

  // Furniture & Accessories Visibilities
  showTable: boolean;
  showChairs: boolean;
  showSocket: boolean;
  showDustbin: boolean;
  showSpotlights: boolean;

  // Placement adjustments (relative or absolute mm)
  tablePositionX: number;
  tablePositionZ: number;
  socketWall: 'left' | 'rear' | 'right';
  socketPositionX: number;
  socketHeightY: number;

  // Annotations
  showDimensions: boolean;
  showFurnitureDimensions: boolean;
  dimensionUnit: 'mm' | 'ft' | 'm';
}

export interface StallSizePreset {
  id: string;
  label: string;
  /** Short tab label */
  tabLabel: string;
  widthM: number;
  depthM: number;
  /** Panel / legend color from the size key image */
  panelColor: string;
}

/**
 * Size → color mapping from the exhibition stall legend.
 * Dimensions are in meters; converted to mm when applied to StallConfig.
 */
export const STALL_SIZE_PRESETS: StallSizePreset[] = [
  { id: '3x2', label: '3 × 2 Mtr.', tabLabel: '3×2 Mtr.', widthM: 3, depthM: 2, panelColor: '#8B864E' },
  { id: '3x3', label: '3 × 3 Mtr.', tabLabel: '3×3 Mtr.', widthM: 3, depthM: 3, panelColor: '#0070C0' },
  { id: '2x2', label: '2 × 2 Mtr.', tabLabel: '2×2 Mtr.', widthM: 2, depthM: 2, panelColor: '#D99694' },
  { id: '4x2', label: '4 × 2 Mtr.', tabLabel: '4×2 Mtr.', widthM: 4, depthM: 2, panelColor: '#B7DDE8' },
  { id: '4x3', label: '4 × 3 Mtr.', tabLabel: '4×3 Mtr.', widthM: 4, depthM: 3, panelColor: '#B1A0C7' },
  { id: '6x6', label: '6 × 6 Mtr.', tabLabel: '6×6 Mtr.', widthM: 6, depthM: 6, panelColor: '#FFC000' },
  { id: '6x5', label: '6 × 5 Mtr.', tabLabel: '6×5 Mtr.', widthM: 6, depthM: 5, panelColor: '#E26B0A' },
];

export function applyStallSizePreset(
  config: StallConfig,
  preset: StallSizePreset
): StallConfig {
  const width = preset.widthM * 1000;
  const depth = preset.depthM * 1000;
  // Keep furniture centered and slightly forward; clamp for small stalls
  const maxTableZ = Math.max(200, Math.floor(depth * 0.25));
  return {
    ...config,
    stallSizeId: preset.id,
    width,
    depth,
    panelColor: preset.panelColor,
    panelFinish: preset.id,
    tablePositionX: 0,
    tablePositionZ: Math.min(500, maxTableZ),
  };
}

export const DEFAULT_CONFIG: StallConfig = applyStallSizePreset(
  {
    stallSizeId: '3x3',
    width: 3000,
    depth: 3000,
    height: 2400,

    fasciaType: 'front',
    fasciaHeight: 228.6,
    fasciaColor: '#ffffff',
    brandingText: 'FMCG EXPO 2027',
    brandingLogoUrl: null,
    textColor: '#1e293b',

    carpetColor: '#b91c1c',
    frameFinish: 'silver',
    panelColor: '#0070C0',
    panelFinish: '3x3',

    showTable: true,
    showChairs: true,
    showSocket: true,
    showDustbin: true,
    showSpotlights: true,

    tablePositionX: 0,
    tablePositionZ: 500,
    socketWall: 'rear',
    socketPositionX: 700,
    socketHeightY: 450,

    showDimensions: true,
    showFurnitureDimensions: true,
    dimensionUnit: 'm',
  },
  STALL_SIZE_PRESETS.find((p) => p.id === '3x3')!
);

export const COLOR_PALETTES = {
  carpets: [
    { id: 'red', label: 'Exhibition Red', hex: '#b91c1c' },
    { id: 'grey', label: 'Neutral Grey', hex: '#64748b' },
    { id: 'charcoal', label: 'Dark Charcoal', hex: '#334155' },
    { id: 'blue', label: 'Royal Blue', hex: '#1d4ed8' },
  ],
  frames: [
    { id: 'silver', label: 'Anodized Silver', hex: '#d1d5db', roughness: 0.35, metalness: 0.85 },
    { id: 'white', label: 'Powdercoat White', hex: '#f8fafc', roughness: 0.5, metalness: 0.15 },
    { id: 'black', label: 'Matte Black', hex: '#1e293b', roughness: 0.6, metalness: 0.2 },
  ],
  panels: STALL_SIZE_PRESETS.map((p) => ({
    id: p.id,
    label: p.label,
    hex: p.panelColor,
    roughness: 0.7,
    metalness: 0.05,
  })),
};
