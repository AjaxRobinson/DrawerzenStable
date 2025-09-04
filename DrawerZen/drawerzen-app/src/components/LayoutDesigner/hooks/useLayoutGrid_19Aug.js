import { useState, useRef, useCallback } from 'react';
import { GRID_SIZE } from '../LayoutDesigner.constants';

export const useLayoutGrid = (initialDimensions = { width: 420, length: 420 }) => {
  // Don't apply viewport-aware orientation - use exact user input dimensions
  const getOrientedDimensions = (dims) => {
    // Simply return the dimensions as-is, preserving user input
    return dims;
  };
  
  const [drawerDimensions, setDrawerDimensions] = useState(getOrientedDimensions(initialDimensions));
  const [cellPixelSize, setCellPixelSize] = useState(20);
  const [gridBounds, setGridBounds] = useState({ width: 0, height: 0 });
  const [isCustomDrawer, setIsCustomDrawer] = useState(false);

  // Step 2: Generate cell-based grid from user input (21mm cells)
  const gridCols = Math.floor(drawerDimensions.width / GRID_SIZE);
  const gridRows = Math.floor(drawerDimensions.length / GRID_SIZE);
  
  // console.log('useLayoutGrid - Grid calculation:', {
  //   drawerDimensions,
  //   GRID_SIZE,
  //   gridCols,
  //   gridRows
  // });
  
  // Calculate aspect ratio based on cell count
  const gridAspectRatio = gridCols / gridRows;

  const calculateGridSize = useCallback((containerWidth, containerHeight) => {
    // Step 3: Scale proportionally within container constraints
    let scaledWidth, scaledHeight;
    
    // Calculate maximum dimensions based on constraints
    const maxWidth = containerWidth * 0.7; // 70% width constraint
    const maxHeight = containerHeight; // Full height constraint
    
    // Determine which constraint is hit first based on aspect ratio
    if (gridAspectRatio > (maxWidth / maxHeight)) {
      // Grid is wider - constrained by width
      scaledWidth = maxWidth;
      scaledHeight = maxWidth / gridAspectRatio;
    } else {
      // Grid is taller - constrained by height
      scaledHeight = maxHeight;
      scaledWidth = maxHeight * gridAspectRatio;
    }
    
    // Calculate pixel size per cell (21mm cell)
    const cellPixelWidth = scaledWidth / gridCols;
    const cellPixelHeight = scaledHeight / gridRows;
    const finalCellPixelSize = Math.min(cellPixelWidth, cellPixelHeight);
    
    // Set reasonable bounds for cell pixel size
    const minCellSize = 4;
    const maxCellSize = 100;
    const boundedCellSize = Math.max(minCellSize, Math.min(finalCellPixelSize, maxCellSize));
    
    // Store final grid bounds using the actual cell size that will be used
    const finalWidth = boundedCellSize * gridCols;
    const finalHeight = boundedCellSize * gridRows;
    setGridBounds({ width: finalWidth, height: finalHeight });
    
    setCellPixelSize(boundedCellSize);
    return boundedCellSize;
  }, [gridCols, gridRows, gridAspectRatio]);

  // Custom setDrawerDimensions that applies orientation logic
  const setDrawerDimensionsWithOrientation = (newDimensions) => {
    setDrawerDimensions(getOrientedDimensions(newDimensions));
  };

  return {
    drawerDimensions,
    setDrawerDimensions: setDrawerDimensionsWithOrientation,
    cellPixelSize,
    setCellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    gridAspectRatio,
    isCustomDrawer,
    setIsCustomDrawer,
    calculateGridSize
  };
};
