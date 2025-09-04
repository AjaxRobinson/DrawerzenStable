import { GRID_SIZE } from './LayoutDesigner.constants';

// Standardized cell-based pricing function
export function calculateBinPrice(bin) {
  if (!bin || !bin.width || !bin.length) return 0;
  
  const cellsX = Math.ceil(bin.width / GRID_SIZE);
  const cellsY = Math.ceil(bin.length / GRID_SIZE);
  const numCells = cellsX * cellsY;
  
  let pricePerCell = 0.10; // Updated base price per cell
  
  // Height multiplier for bins taller than one grid unit
  if (bin.height > GRID_SIZE) {
    const extraHeight = bin.height - GRID_SIZE;
    const heightMultiplier = 1 + (extraHeight / GRID_SIZE) * 0.5;
    pricePerCell *= heightMultiplier;
  }
  
  // Shadow board cost per cell
  let shadowBoardCost = 0;
  if (bin.shadowBoard) {
    shadowBoardCost = numCells * 0.11; // $0.11 per cell for shadow foam
  }
  
  return Math.round((numCells * pricePerCell + shadowBoardCost) * 100) / 100;
}

// Function to calculate baseplate cost
export function calculateBaseplateCost(drawerDimensions) {
  if (!drawerDimensions || !drawerDimensions.width || !drawerDimensions.length) return 0;
  
  const gridCols = Math.floor(drawerDimensions.width / GRID_SIZE);
  const gridRows = Math.floor(drawerDimensions.length / GRID_SIZE);
  const totalCells = gridCols * gridRows;
  
  return Math.round(totalCells * 0.02 * 100) / 100; // $0.02 per cell for baseplate
}

// Legacy function - redirects to standardized version
export function calculatePrice(bin, customization = {}) {
  const binWithCustomization = {
    ...bin,
    height: customization.height || bin.height || GRID_SIZE,
    shadowBoard: customization.shadowBoarded || bin.shadowBoard || false
  };
  return calculateBinPrice(binWithCustomization);
}
