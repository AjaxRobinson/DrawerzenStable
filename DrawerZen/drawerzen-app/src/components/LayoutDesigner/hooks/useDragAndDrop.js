import { useState, useCallback } from 'react';
import { GRID_SIZE } from '../LayoutDesigner.constants'; // Import GRID_SIZE for clarity

export const useDragAndDrop = (placedBins, setPlacedBins, gridCols, gridRows, cellPixelSize, checkBounds, checkCollision) => {
  const [draggedBin, setDraggedBin] = useState(null);
  const [dropShadow, setDropShadow] = useState(null);
  const [isCarouselDropTarget, setIsCarouselDropTarget] = useState(false);

  const handleDragStart = useCallback((bin) => {
    setDraggedBin(bin);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedBin(null);
    setDropShadow(null);
    setIsCarouselDropTarget(false);
  }, []);

  // x, y are expected to be in millimeters (representing the top-left corner of the bin)
  const handleGridHover = useCallback((x_mm, y_mm) => {
    if (!draggedBin) return;

    const newBin = { ...draggedBin, x: x_mm, y: y_mm };
    const isValid = checkBounds(newBin) && !checkCollision(newBin, draggedBin.id);

    // Convert millimeter coordinates to pixel positions for shadow display
    // This correctly maps mm grid positions to pixel positions within the GridBoundingBox
    const pixelX = (x_mm / GRID_SIZE) * cellPixelSize;
    const pixelY = (y_mm / GRID_SIZE) * cellPixelSize;
    const pixelWidth = (draggedBin.width / GRID_SIZE) * cellPixelSize;
    const pixelHeight = (draggedBin.length / GRID_SIZE) * cellPixelSize;

    setDropShadow({
      left: pixelX,
      top: pixelY,
      width: pixelWidth,
      height: pixelHeight,
      visible: true,
      error: !isValid
    });
  }, [draggedBin, cellPixelSize, checkBounds, checkCollision]); // Added GRID_SIZE dependency if it's imported

  // x, y are expected to be in millimeters
  const handleGridDrop = useCallback((x_mm, y_mm) => {
    if (!draggedBin) return;

    const newBin = { ...draggedBin, x: x_mm, y: y_mm };
    const isValid = checkBounds(newBin) && !checkCollision(newBin, draggedBin.id);

    if (isValid) {
      setPlacedBins(prev =>
        prev.map(bin =>
          bin.id === draggedBin.id
            ? { ...bin, x: x_mm, y: y_mm } // Store position in mm
            : bin
        )
      );
    }

    setDraggedBin(null);
    setDropShadow(null);
  }, [draggedBin, checkBounds, checkCollision, setPlacedBins]);

  const handleCarouselDrop = useCallback(() => {
    if (!draggedBin) return;

    setPlacedBins(prev => prev.filter(bin => bin.id !== draggedBin.id));
    setDraggedBin(null);
    setIsCarouselDropTarget(false);
  }, [draggedBin, setPlacedBins]);

  const handleCarouselDragOver = useCallback(() => {
    if (draggedBin) {
      setIsCarouselDropTarget(true);
    }
  }, [draggedBin]);

  const handleCarouselDragLeave = useCallback(() => {
    setIsCarouselDropTarget(false);
  }, []);

  return {
    draggedBin,
    dropShadow,
    isCarouselDropTarget,
    handleDragStart,
    handleDragEnd,
    handleGridHover, // Receives mm coordinates
    handleGridDrop,  // Receives mm coordinates
    handleCarouselDrop,
    handleCarouselDragOver,
    handleCarouselDragLeave,
    setDropShadow
  };
};