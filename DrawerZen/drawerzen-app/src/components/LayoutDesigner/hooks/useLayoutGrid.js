import { useState, useCallback, useEffect } from 'react';
import { GRID_SIZE } from '../LayoutDesigner.constants';

export const useLayoutGrid = (initialDimensions = { width: 420, length: 420 }) => {

  const [drawerDimensions, setDrawerDimensions] = useState(() => ({
    ...initialDimensions,
    width: Math.max(initialDimensions.width, GRID_SIZE),
    length: Math.max(initialDimensions.length, GRID_SIZE)
  }));
  
  const [cellPixelSize, setCellPixelSize] = useState(20);
  const [gridBounds, setGridBounds] = useState({ width: 0, height: 0 });
  
 
  const gridCols = Math.floor(drawerDimensions.width / GRID_SIZE);
  const gridRows = Math.floor(drawerDimensions.length / GRID_SIZE);
  
 
  const gridAspectRatio = gridRows > 0 ? gridCols / gridRows : 1;


  const calculateGridSize = useCallback((containerWidth, containerHeight) => {
   
    if (gridCols === 0 || gridRows === 0) {
      setGridBounds({ width: 0, height: 0 });
      setCellPixelSize(20);
      return 20;
    }


    const maxWidth = containerWidth * 0.7;
    const maxHeight = containerHeight;
    
    let scaledWidth, scaledHeight;

    if (gridAspectRatio > (maxWidth / maxHeight)) {
      scaledWidth = maxWidth;
      scaledHeight = maxWidth / gridAspectRatio;
    } else {
      scaledHeight = maxHeight;
      scaledWidth = maxHeight * gridAspectRatio;
    }
    

    const cellPixelWidth = scaledWidth / gridCols;
    const cellPixelHeight = scaledHeight / gridRows;
    const finalCellPixelSize = Math.min(cellPixelWidth, cellPixelHeight);
    

    const minCellSize = 8;
    const maxCellSize = 60;
    const boundedCellSize = Math.max(minCellSize, Math.min(finalCellPixelSize, maxCellSize));
    
    const finalWidth = boundedCellSize * gridCols;
    const finalHeight = boundedCellSize * gridRows;
    
    setGridBounds({ width: finalWidth, height: finalHeight });
    setCellPixelSize(boundedCellSize);
    
    return boundedCellSize;
  }, [gridCols, gridRows, gridAspectRatio]);


  useEffect(() => {
    if (initialDimensions) {
      setDrawerDimensions({
        width: Math.max(initialDimensions.width, GRID_SIZE),
        length: Math.max(initialDimensions.length, GRID_SIZE)
      });
    }
  }, [initialDimensions]);

  return {
    drawerDimensions,
    setDrawerDimensions,
    cellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    gridAspectRatio,
    calculateGridSize
  };
};