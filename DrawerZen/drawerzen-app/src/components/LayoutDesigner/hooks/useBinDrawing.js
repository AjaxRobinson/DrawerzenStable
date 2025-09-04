import { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GRID_SIZE, BIN_CONSTRAINTS } from '../LayoutDesigner.constants';

export const useBinDrawing = (gridCols, gridRows, placedBins, setPlacedBins, gridSize, pushUndoState) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawEnd, setDrawEnd] = useState(null);
  const [drawingPreview, setDrawingPreview] = useState(null);
  const [drawingError, setDrawingError] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const drawingContainerRef = useRef(null);

  const checkCollision = useCallback((newBin) => {
    return placedBins.some(bin => {
      const newBinRight = newBin.x + newBin.width;
      const newBinBottom = newBin.y + newBin.length;
      const binRight = bin.x + bin.width;
      const binBottom = bin.y + bin.length;
      
      return !(newBinRight <= bin.x || 
               newBin.x >= binRight || 
               newBinBottom <= bin.y || 
               newBin.y >= binBottom);
    });
  }, [placedBins]);

  const validateBinSize = useCallback((width, length) => {
    // Convert from grid cells (21mm each) to actual millimeters
    const actualWidth = width * GRID_SIZE;
    const actualLength = length * GRID_SIZE;
    const area = actualWidth * actualLength;
    // Area-based minimum bin validation
    if (area <= 441) { // 21mm x 21mm = 441 square mm (1 cell)
      return false;
    }
    // Otherwise, check all constraints
    return actualWidth >= BIN_CONSTRAINTS.minWidth && 
           actualWidth <= BIN_CONSTRAINTS.maxWidth && 
           actualLength >= BIN_CONSTRAINTS.minLength && 
           actualLength <= BIN_CONSTRAINTS.maxLength &&
           area >= BIN_CONSTRAINTS.MIN_AREA_REQUIREMENT;
  }, []);

  const getGridPosition = useCallback((clientX, clientY) => {
    if (!drawingContainerRef.current) return null;
    
    const rect = drawingContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Get cell pixel size from the grid
    const cellPixelSize = rect.width / gridCols;
    
    const gridX = Math.floor(x / cellPixelSize);
    const gridY = Math.floor(y / cellPixelSize);
    
    return { gridX, gridY };
  }, [gridCols]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    
    if (pos.gridX >= 0 && pos.gridX < gridCols && pos.gridY >= 0 && pos.gridY < gridRows) {
      setIsDrawing(true);
      setDrawStart(pos);
      setDrawEnd(pos);
      setDrawingError(null);
      setErrorMessage('');
    }
  }, [getGridPosition, gridCols, gridRows]);

  const handleMouseMove = useCallback((e) => {
    if (!isDrawing) return;
    
    const pos = getGridPosition(e.clientX, e.clientY);
    if (!pos) return;
    
    const endX = Math.max(0, Math.min(pos.gridX, gridCols - 1));
    const endY = Math.max(0, Math.min(pos.gridY, gridRows - 1));
    
    setDrawEnd({ gridX: endX, gridY: endY });
    
    // Calculate bin dimensions in grid cells
    const x = Math.min(drawStart.gridX, endX);
    const y = Math.min(drawStart.gridY, endY);
    const width = Math.abs(endX - drawStart.gridX) + 1;
    const length = Math.abs(endY - drawStart.gridY) + 1;
    
    // Convert to millimeter coordinates for collision checking
    const binInMm = { 
      x: x * GRID_SIZE, 
      y: y * GRID_SIZE, 
      width: width * GRID_SIZE, 
      length: length * GRID_SIZE 
    };
    
    const hasCollision = checkCollision(binInMm);
    const isValidSize = validateBinSize(width, length);
    
    if (!isValidSize) {
      const minCells = Math.round(BIN_CONSTRAINTS.minWidth / GRID_SIZE);
      const maxCells = Math.round(BIN_CONSTRAINTS.maxWidth / GRID_SIZE);
      // Show error if either dimension is below min or above max
      if (width <= 1 && length <= 1) {
        setDrawingError('size');
        setErrorMessage(`Bin size must be between ${minCells} and ${maxCells} cells`);
      } else if (width > maxCells || length > maxCells) {
        setDrawingError('size');
        setErrorMessage(`Bin size cannot exceed ${maxCells} cells`);
      } else {
        setDrawingError(null);
        setErrorMessage('');
      }
    } else if (hasCollision) {
      setDrawingError('collision');
      setErrorMessage('Cannot place bin here - overlaps with existing bin');
    } else {
      setDrawingError(null);
      setErrorMessage('');
    }
    
    // Set preview using pixel coordinates for rendering
    const cellPixelSize = drawingContainerRef.current ? 
      drawingContainerRef.current.getBoundingClientRect().width / gridCols : 0;
    
    setDrawingPreview({
      left: x * cellPixelSize,
      top: y * cellPixelSize,
      width: width * cellPixelSize,
      height: length * cellPixelSize,
      hasError: !isValidSize || hasCollision
    });
  }, [isDrawing, getGridPosition, drawStart, gridCols, gridRows, checkCollision, validateBinSize]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawEnd) {
      setIsDrawing(false);
      setDrawingPreview(null);
      return;
    }
    
    const x = Math.min(drawStart.gridX, drawEnd.gridX);
    const y = Math.min(drawStart.gridY, drawEnd.gridY);
    const width = Math.abs(drawEnd.gridX - drawStart.gridX) + 1;
    const length = Math.abs(drawEnd.gridY - drawStart.gridY) + 1;
    
    // Convert to millimeter coordinates for final bin
    const binInMm = { 
      x: x * GRID_SIZE, 
      y: y * GRID_SIZE, 
      width: width * GRID_SIZE, 
      length: length * GRID_SIZE 
    };
    
    const hasCollision = checkCollision(binInMm);
    const isValidSize = validateBinSize(width, length);
    
    if (isValidSize && !hasCollision) {
      // Capture state before adding new drawn bin
      if (typeof pushUndoState === 'function') {
        pushUndoState();
      }
      const newBin = {
        id: uuidv4(),
        x: binInMm.x,
        y: binInMm.y,
        width: binInMm.width,
        length: binInMm.length,
        height: 21,
        shadowBoard: false,
        name: `Custom ${Math.round(binInMm.width)}×${Math.round(binInMm.length)}mm`,
        color: '#F5E6C8',
        colorway: 'cream'
      };
      
      setPlacedBins(prev => [...prev, newBin]);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
    setDrawingPreview(null);
    setDrawingError(null);
    setErrorMessage('');
  }, [isDrawing, drawStart, drawEnd, checkCollision, validateBinSize, setPlacedBins]);

  return {
    isDrawing,
    drawingPreview,
    drawingError,
    errorMessage,
    drawingContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setErrorMessage
  };
};
