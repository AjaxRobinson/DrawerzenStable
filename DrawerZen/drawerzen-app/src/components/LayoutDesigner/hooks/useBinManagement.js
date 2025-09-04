import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export const useBinManagement = (gridCols, gridRows) => {
  const [placedBins, setPlacedBins] = useState([]);
  const [selectedBin, setSelectedBin] = useState(null);

  const addBin = useCallback((newBin) => {
    const binWithId = newBin.id ? newBin : { ...newBin, id: uuidv4() };
    setPlacedBins(prev => [...prev, binWithId]);
  }, []);

  const removeBin = useCallback((binId) => {
    setPlacedBins(prev => prev.filter(bin => bin.id !== binId));
    if (selectedBin?.id === binId) {
      setSelectedBin(null);
    }
  }, [selectedBin]);

  const clearAllBins = useCallback(() => {
    setPlacedBins([]);
    setSelectedBin(null);
  }, []);

  const moveBin = useCallback((binId, newX, newY) => {
    setPlacedBins(prev => 
      prev.map(bin => 
        bin.id === binId 
          ? { ...bin, x: newX, y: newY }
          : bin
      )
    );
  }, []);

  const selectBin = useCallback((bin) => {
    setSelectedBin(selectedBin?.id === bin.id ? null : bin);
  }, [selectedBin]);

  const checkCollision = useCallback((newBin, excludeId = null) => {
    return placedBins.some(bin => {
      if (excludeId && bin.id === excludeId) return false;
      
      const newBinRight = newBin.x + newBin.width;
      const newBinBottom = newBin.y + (newBin.length || newBin.height); // Handle both length and height properties
      const binRight = bin.x + bin.width;
      const binBottom = bin.y + (bin.length || bin.height);
      
      return !(newBinRight <= bin.x || 
               newBin.x >= binRight || 
               newBinBottom <= bin.y || 
               newBin.y >= binBottom);
    });
  }, [placedBins]);

  const checkBounds = useCallback((bin) => {
    const binRight = bin.x + bin.width;
    const binBottom = bin.y + (bin.length || bin.height);
    
    // Check against the actual drawer dimensions in millimeters
    // Using unified 21mm grid system: gridCols * 21mm
    return bin.x >= 0 && 
           bin.y >= 0 && 
           binRight <= gridCols * 21 && // 21mm per grid cell
           binBottom <= gridRows * 21;
  }, [gridCols, gridRows]);

  const isValidPlacement = useCallback((bin, excludeId = null) => {
    return checkBounds(bin) && !checkCollision(bin, excludeId);
  }, [checkBounds, checkCollision]);

  return {
    placedBins,
    setPlacedBins,
    selectedBin,
    setSelectedBin,
    addBin,
    removeBin,
    clearAllBins,
    moveBin,
    selectBin,
    checkCollision,
    checkBounds,
    isValidPlacement
  };
};
