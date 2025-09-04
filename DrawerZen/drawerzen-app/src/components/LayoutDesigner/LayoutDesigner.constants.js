// Constants
export const GRID_SIZE = 21; // 21mm precision
export const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Standard bin sizes for auto-fill (in mm) - ordered by area (largest first)
export const STANDARD_BIN_SIZES = [
  { width: 168, length: 168 }, // 8x8 cells - largest
  { width: 147, length: 147 }, // 7x7 cells
  { width: 126, length: 126 }, // 6x6 cells
  { width: 105, length: 105 }, // 5x5 cells
  { width: 84, length: 168 },  // 4x8 cells
  { width: 84, length: 147 },  // 4x7 cells
  { width: 84, length: 126 },  // 4x6 cells
  { width: 84, length: 105 },  // 4x5 cells
  { width: 84, length: 84 },   // 4x4 cells
  { width: 63, length: 147 },  // 3x7 cells
  { width: 63, length: 126 },  // 3x6 cells
  { width: 63, length: 105 },  // 3x5 cells
  { width: 63, length: 84 },   // 3x4 cells
  { width: 63, length: 63 },   // 3x3 cells
  { width: 42, length: 168 },  // 2x8 cells
  { width: 42, length: 147 },  // 2x7 cells
  { width: 42, length: 126 },  // 2x6 cells
  { width: 42, length: 105 },  // 2x5 cells
  { width: 42, length: 84 },   // 2x4 cells
  { width: 42, length: 63 },   // 2x3 cells
  { width: 42, length: 42 },   // 2x2 cells
  { width: 21, length: 168 },  // 1x8 cells
  { width: 21, length: 147 },  // 1x7 cells
  { width: 21, length: 126 },  // 1x6 cells
  { width: 21, length: 105 },  // 1x5 cells
  { width: 21, length: 84 },   // 1x4 cells
  { width: 21, length: 63 },   // 1x3 cells
  { width: 21, length: 42 },   // 1x2 cells - smallest
];

// Validation constraints
export const BIN_CONSTRAINTS = {
  minWidth: 21,
  maxWidth: 320,
  minLength: 21, // Minimum length is 42mm (2 cells) to prevent 1x1 bins
  maxLength: 320,
  MIN_SIZE: 21,
  MIN_AREA_REQUIREMENT: 441, // Minimum area: 21mm x 21mm = 441 square mm (1 cell)
  MAX_SIZE: 320,
  GRID_INCREMENT: 21
};

// Design System Constants
export const DESIGN_TOKENS = {
  borderRadius: {
    small: '4px',
    medium: '8px',
    large: '16px'
  },
  colors: {
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    border: '#e5e7eb',
    borderFocus: '#4f46e5',
    text: '#374151',
    textSecondary: '#6b7280',
    background: '#f9fafb',
    backgroundSecondary: '#f3f4f6',
    white: '#ffffff'
  },
  shadows: {
    small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    medium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    large: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  }
};

// Layout Constants
export const LAYOUT_CONSTANTS = {
  margins: {
    desktop: '0.5rem',
    mobile: '0.5rem'
  },
  containerWidth: {
    desktop: 'calc(100vw - 1rem)', // 100vw minus total margins (0.5rem * 2)
    mobile: 'calc(100vw - 1rem)'   // 100vw minus total margins (0.5rem * 2)
  },
  viewportHeight: {
    navBarHeight: '80px',
    navBarHeightMobile: '70px'
  }
};

export const BIN_COLORWAYS = [
  { id: 'cream', name: 'Cream / Slate', bin: '#F5E6C8', bed: '#4A4A58' },
  { id: 'blue', name: 'Dark Blue / Sky', bin: '#1A237E', bed: '#90CAF9' },
  { id: 'black', name: 'Black / Lime', bin: '#222222', bed: '#B2FF59' }
];
