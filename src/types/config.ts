export interface StallConfig {
  // Dimensions in millimeters
  width: number; // default 3000
  depth: number; // default 3000
  height: number; // default 2400

  // Fascia
  fasciaType: 'front' | 'three-sided';
  fasciaHeight: number; // 228.6 mm (9 inches)
  fasciaColor: string;
  brandingText: string;
  brandingLogoUrl: string | null;
  textColor: string;

  // Finishes
  carpetColor: string; // 'grey' | 'charcoal' | 'blue' | 'red'
  frameFinish: string; // 'silver' | 'white' | 'black'
  panelFinish: string; // 'white' | 'light-grey' | 'charcoal'

  // Furniture & Accessories Visibilities
  showTable: boolean;
  showChairs: boolean;
  showSocket: boolean;
  showDustbin: boolean;
  showSpotlights: boolean;

  // Placement adjustments (relative or absolute mm)
  tablePositionX: number; // -1000 to +1000 mm from center
  tablePositionZ: number; // front-back position
  socketWall: 'left' | 'rear' | 'right';
  socketPositionX: number; // mm along wall
  socketHeightY: number; // mm from floor

  // Annotations
  showDimensions: boolean;
  showFurnitureDimensions: boolean;
}

export const DEFAULT_CONFIG: StallConfig = {
  width: 3000,
  depth: 3000,
  height: 2400,

  fasciaType: 'front',
  fasciaHeight: 228.6, // ~9 inches
  fasciaColor: '#ffffff',
  brandingText: 'EXPO INNOVATIONS LTD',
  brandingLogoUrl: null,
  textColor: '#1e293b',

  carpetColor: '#64748b', // neutral grey
  frameFinish: 'silver',
  panelFinish: 'white',

  showTable: true,
  showChairs: true,
  showSocket: true,
  showDustbin: true,
  showSpotlights: true,

  tablePositionX: 0,
  tablePositionZ: 500, // toward front entrance
  socketWall: 'rear',
  socketPositionX: 700,
  socketHeightY: 450, // 450 mm above floor

  showDimensions: true,
  showFurnitureDimensions: false,
};

export const COLOR_PALETTES = {
  carpets: [
    { id: 'grey', label: 'Neutral Grey', hex: '#64748b' },
    { id: 'charcoal', label: 'Dark Charcoal', hex: '#334155' },
    { id: 'blue', label: 'Royal Blue', hex: '#1d4ed8' },
    { id: 'red', label: 'Exhibition Red', hex: '#b91c1c' },
  ],
  frames: [
    { id: 'silver', label: 'Anodized Silver', hex: '#d1d5db', roughness: 0.35, metalness: 0.85 },
    { id: 'white', label: 'Powdercoat White', hex: '#f8fafc', roughness: 0.5, metalness: 0.15 },
    { id: 'black', label: 'Matte Black', hex: '#1e293b', roughness: 0.6, metalness: 0.2 },
  ],
  panels: [
    { id: 'white', label: 'Pure White', hex: '#fcfcfd', roughness: 0.7, metalness: 0.05 },
    { id: 'light-grey', label: 'Light Grey', hex: '#e2e8f0', roughness: 0.7, metalness: 0.05 },
    { id: 'charcoal', label: 'Charcoal', hex: '#334155', roughness: 0.7, metalness: 0.05 },
  ],
};
