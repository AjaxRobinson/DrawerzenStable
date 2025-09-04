import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';

// Modular imports
import { GRID_SIZE, STANDARD_BIN_SIZES, colors } from './LayoutDesigner.constants';
import { calculatePrice, calculateBinPrice, calculateBaseplateCost } from './LayoutDesigner.utils';
import { 
  DesignerContainer,
  DrawerContainer,
  GridSection,
  GridAndPanelContainer,
  GridContainer,
  GridWrapper,
  GridBoundingBox,
  ErrorNotification,
  CenterErrorMessage,
  InstructionText,
  LayoutMainColumns,
  LeftColumn,
  CenterColumn,
  RightColumn,
  ReviewButtonContainer,
  ReviewButton,
  Drawer3DWrapper,
  BinOptionsAccordion
} from './LayoutDesigner.styles';

// Custom hooks
import { useLayoutGrid } from './hooks/useLayoutGrid';
import { useBinManagement } from './hooks/useBinManagement';
import { useBinDrawing } from './hooks/useBinDrawing';
import { useDragAndDrop } from './hooks/useDragAndDrop';

// Services
import { BinSortingService } from './services/BinSortingService';

// Components
import ActionButtons from './components/ActionButtons';
import BinGrid from './components/BinGrid';
import Drawer3DView from './components/Drawer3DView';
import BinOptionsPanel from './components/BinOptionsPanel';

export default function LayoutDesigner({ drawerDimensions, availableBins = [], onLayoutComplete, initialLayout, underlayImage, dataManager }) {
  // Debug: log when underlay image prop changes
  useEffect(() => {
    if (underlayImage) {
      console.log('[LayoutDesigner] underlayImage prop len/prefix:', underlayImage.length, underlayImage.slice(0, 48));
    } else {
      console.log('[LayoutDesigner] underlayImage prop is null/undefined');
    }
  }, [underlayImage]);
  // Undo stack for placedBins and remainingBins (captures structural & visual changes, not names)
  const [undoStack, setUndoStack] = useState([]);
  const navigate = useNavigate();
  
  // Window size state for responsive grid
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Layout grid hook
  const {
    drawerDimensions: gridDimensions,
    setDrawerDimensions,
    cellPixelSize,
    setCellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    gridAspectRatio,
    calculateGridSize
  } = useLayoutGrid({
    ...drawerDimensions,
    maxWidth: 320,
    maxLength: 320
  });

  // Update drawer dimensions when props change
  useEffect(() => {
    console.log('LayoutDesigner - drawerDimensions prop:', drawerDimensions);
    if (drawerDimensions) {
      setDrawerDimensions(drawerDimensions);
    }
  }, [drawerDimensions, setDrawerDimensions]);

  // Debug logging for grid dimensions
  useEffect(() => {
    console.log('LayoutDesigner - Grid state:', {
      gridDimensions,
      gridCols,
      gridRows,
      cellPixelSize,
      gridBounds
    });
  }, [gridDimensions, gridCols, gridRows, cellPixelSize, gridBounds]);

  // Restore bins from initialLayout when available
  useEffect(() => {
    if (initialLayout && Array.isArray(initialLayout) && initialLayout.length > 0) {
      // Convert initialLayout bins to placedBins format with positions
      const restoredBins = initialLayout.map(item => ({
        id: item.id || uuidv4(), // Ensure each bin has an ID
        originalId: item.originalId || item.id,
        x: item.x || 0, // Position in millimeters
        y: item.y || 0, // Position in millimeters
        width: item.width,
        length: item.length,
        height: item.height || 21,
        shadowBoard: item.shadowBoard || false,
        name: item.name || `Bin ${item.id}`,
        color: item.color || colors[0],
        colorway: item.colorway || 'cream'
      }));
      
      setPlacedBins(restoredBins);
    }
  }, [initialLayout, setPlacedBins]);

  // Bin management hook
  const {
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
  } = useBinManagement(gridCols, gridRows);

  // Calculate responsive cell size
  useEffect(() => {
    // Removed dynamic panelWidth influence so grid remains static when selecting a bin
    const buttonWidth = 160;
    const isMobile = windowSize.width < 768;
    const gutterWidth = isMobile ? 32 : 80;
    const containerPadding = isMobile ? 32 : 64;

    const maxGridWidth = windowSize.width - gutterWidth - containerPadding - buttonWidth;
    const maxGridHeight = (windowSize.height - 80) * 0.65; // Use 65% of remaining viewport height for grid area after nav

    calculateGridSize(maxGridWidth, maxGridHeight);
  }, [windowSize, calculateGridSize]);

  // State for remaining bins and errors (moved above undo helpers to allow inclusion in snapshots)
  const [remainingBins, setRemainingBins] = useState([...availableBins]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);

  // Utility function for center error messages
  const showCenterError = (message) => {
    setCenterErrorMessage(message);
    setTimeout(() => setCenterErrorMessage(null), 3000);
  };

  // Push current state to undo stack (limit length to avoid unbounded growth)
  const pushUndoState = () => {
    setUndoStack(prev => [
      { placedBins: [...placedBins], remainingBins: [...remainingBins] },
      ...prev.slice(0, 49) // cap at 50 snapshots
    ]);
  };

  // Bin drawing hook (provide callback so drawing additions are undoable)
  const {
    isDrawing,
    drawingPreview,
    drawingError,
    errorMessage,
    drawingContainerRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    setErrorMessage
  } = useBinDrawing(gridCols, gridRows, placedBins, setPlacedBins, GRID_SIZE, () => pushUndoState());

  // Drag and drop hook
  const {
    draggedBin,
    dropShadow,
    isCarouselDropTarget,
    handleDragStart,
    handleDragEnd,
    handleGridHover,
    handleGridDrop,
    handleCarouselDrop,
    handleCarouselDragOver,
    handleCarouselDragLeave,
    setDropShadow
  } = useDragAndDrop(placedBins, setPlacedBins, gridCols, gridRows, cellPixelSize, checkBounds, checkCollision);

  // Undo handler (preserves any name edits made after snapshot)
  const handleUndo = () => {
    if (undoStack.length === 0) {
      showCenterError('Nothing to undo');
      return;
    }
    const lastState = undoStack[0];
    // Preserve current names (names should not be affected by undo per requirements)
    const currentNames = new Map(placedBins.map(b => [b.id, b.name]));
    const restoredBins = lastState.placedBins.map(b => ({ ...b, name: currentNames.get(b.id) ?? b.name }));
    setPlacedBins(restoredBins);
    setRemainingBins(lastState.remainingBins);
    setUndoStack(undoStack.slice(1));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  // Carousel drop zone setup
  const [, carouselDrop] = useDrop({
    accept: ['bin', 'placed-bin'],
    drop: (item) => {
      if (item.placedBinId) {
        // Moving bin from grid to carousel
        const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
        if (binToMove) {
          // Remove from placed bins
          setPlacedBins(prev => prev.filter(bin => bin.id !== item.placedBinId));
          
          // Find original bin data or create carousel version
          const originalBin = availableBins.find(b => b.id === binToMove.originalId) || {
            id: binToMove.originalId || binToMove.id,
            label: binToMove.name,
            width: binToMove.width,
            length: binToMove.length,
            color: binToMove.color
          };
          
          // Add back to carousel
          setRemainingBins(prev => [...prev, originalBin]);
        }
      }
    },
    hover: handleCarouselDragOver,
    collect: (monitor) => ({
      isCarouselDropTarget: monitor.isOver() && monitor.getItem()?.placedBinId,
    }),
  });

  // Main grid drop zone setup
  const [{ isOver }, drop] = useDrop({
    accept: ['bin', 'placed-bin'],
    hover: (item, monitor) => {
      if (item.bin || item.placedBinId) {
        const gridElement = document.querySelector('[data-grid="true"]');
        const clientOffset = monitor.getClientOffset();
        
        if (gridElement && clientOffset) {
          const gridRect = gridElement.getBoundingClientRect();
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          
          // Calculate position in 21mm increments using unified grid system
          const gridX = Math.floor(x / cellPixelSize);
          const gridY = Math.floor(y / cellPixelSize);
          
          // Convert to millimeter coordinates (21mm increments)
          const mmX = gridX * GRID_SIZE;
          const mmY = gridY * GRID_SIZE;
          
          // Create virtual dragged bin for carousel items or use existing draggedBin
          let currentDraggedBin = draggedBin;
          
          if (item.bin && !currentDraggedBin) {
            // Bin from carousel - create virtual dragged bin
            currentDraggedBin = {
              id: item.bin.id,
              width: item.bin.width,
              length: item.bin.length,
              x: mmX,
              y: mmY
            };
          }
          
          if (currentDraggedBin) {
            const newBin = { ...currentDraggedBin, x: mmX, y: mmY };
            const isValid = checkBounds(newBin) && !checkCollision(newBin, currentDraggedBin.id);

            // Convert millimeter coordinates to pixel positions for shadow display
            const pixelX = (mmX / 21) * cellPixelSize;
            const pixelY = (mmY / 21) * cellPixelSize;
            const pixelWidth = (currentDraggedBin.width / 21) * cellPixelSize;
            const pixelHeight = (currentDraggedBin.length / 21) * cellPixelSize;

            setDropShadow({
              left: pixelX,
              top: pixelY,
              width: pixelWidth,
              height: pixelHeight,
              visible: true,
              error: !isValid
            });
          } else {
            handleGridHover(mmX, mmY);
          }
        }
      }
    },
    drop: (item, monitor) => {
      const gridElement = document.querySelector('[data-grid="true"]');
      const clientOffset = monitor.getClientOffset();
      
      if (gridElement && clientOffset) {
        const gridRect = gridElement.getBoundingClientRect();
        const x = clientOffset.x - gridRect.left;
        const y = clientOffset.y - gridRect.top;
        
        // Calculate position in 21mm increments using unified grid system
        const gridX = Math.floor(x / cellPixelSize);
        const gridY = Math.floor(y / cellPixelSize);
        
        if (item.placedBinId) {
          // Moving existing bin - convert to millimeters
          const newX = gridX * GRID_SIZE; // 21mm increments
          const newY = gridY * GRID_SIZE;
          
          if (isValidPlacement({ ...draggedBin, x: newX, y: newY }, item.placedBinId)) {
            pushUndoState();
            moveBin(item.placedBinId, newX, newY);
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        } else if (item.bin) {
          // Placing new bin from carousel - convert to millimeters
          const newBin = {
            id: uuidv4(),
            originalId: item.bin.id,
            x: gridX * GRID_SIZE, // Convert to 21mm increments
            y: gridY * GRID_SIZE,
            width: item.bin.width,
            length: item.bin.length,
            height: 21,
            shadowBoard: false,
            name: item.bin.label,
            color: item.bin.color,
            colorway: 'cream'
          };

          if (isValidPlacement(newBin)) {
            pushUndoState();
            addBin(newBin);
            setRemainingBins(prev => prev.filter(bin => bin.id !== item.bin.id));
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Clear drop shadow when not hovering over grid
  useEffect(() => {
    if (!isOver) {
      setDropShadow(null);
    }
  }, [isOver, setDropShadow]);

  // Bin event handlers
  const handleBinClick = (bin) => {
    selectBin(bin);
    setSelectedBinId(bin.id);
  };

  const handleBinDoubleClick = (bin) => {
    removeBin(bin.id);
    
    // Add back to available bins if it was originally from availableBins
    const originalBin = availableBins.find(b => b.id === bin.originalId);
    if (originalBin) {
      setRemainingBins(prev => [...prev, originalBin]);
    }
  };

  const handleBinSave = (updatedBin) => {
    // Determine if save affects undoable properties (colorway/color/height or structural)
    const prevBin = placedBins.find(b => b.id === updatedBin.id);
    if (prevBin) {
      const affectsUndo = prevBin.height !== updatedBin.height || prevBin.colorway !== updatedBin.colorway || prevBin.color !== updatedBin.color;
      if (affectsUndo) pushUndoState();
    }
    setPlacedBins(prev => prev.map(bin => bin.id === updatedBin.id ? updatedBin : bin));
    // Collapse panel & deselect after save
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleBinDelete = (binId) => {
    pushUndoState();
    handleBinDoubleClick(placedBins.find(bin => bin.id === binId));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handlePanelClose = () => {
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  // Action button handlers
  const handleAutoSort = () => {
    pushUndoState();
    if (placedBins.length === 0) {
      showCenterError('No bins to sort');
      return;
    }

    const { placedBins: sortedBins, unplacedBins } = BinSortingService.autoSortBins(
      placedBins, 
      gridCols, 
      gridRows
    );

    setPlacedBins(sortedBins);
    
    if (unplacedBins.length > 0) {
      // Add unplaced bins back to carousel
      const carouselBins = unplacedBins.map(bin => ({
        id: bin.originalId || bin.id,
        label: bin.name,
        width: bin.width,
        length: bin.length,
        color: bin.color
      }));
      setRemainingBins(prev => [...prev, ...carouselBins]);
      showCenterError(`Sorted ${sortedBins.length} bins, ${unplacedBins.length} returned to carousel`);
    } else {
      showCenterError('All bins sorted successfully!');
    }
  };

  const handleGenerateBins = () => {
    pushUndoState();
    const newBins = [];
    let binCounter = 0;
    let currentPlacedBins = [...placedBins]; // Working copy to track placements
    
    // Continue placing bins until no more can be placed
    let canPlaceMore = true;
    let iterations = 0;
    const maxIterations = 200; // Increased limit for comprehensive filling
    
    while (canPlaceMore && iterations < maxIterations) {
      iterations++;
      canPlaceMore = false;
      
      // Find all available gaps (minimum 2 cells area to avoid 1x1 gaps)
      const gaps = BinSortingService.findAllGaps(gridCols, gridRows, currentPlacedBins, 2);
      
      if (gaps.length === 0) {
        break; // No more fillable gaps available
      }

      // Try to fill each gap with the largest possible bin
      for (const gap of gaps) {
        // Convert gap dimensions to millimeters
        const gapWidthMM = gap.width * GRID_SIZE;
        const gapHeightMM = gap.height * GRID_SIZE;

        // Try to fit the largest possible bin in this gap
        let binPlaced = false;
        for (const binSize of STANDARD_BIN_SIZES) {
          // Check if bin fits in the gap
          if (binSize.width <= gapWidthMM && binSize.length <= gapHeightMM) {
            const newBin = {
              id: uuidv4(),
              x: gap.x * GRID_SIZE, // Convert cell position to mm
              y: gap.y * GRID_SIZE, // Convert cell position to mm
              width: binSize.width,
              length: binSize.length,
              height: 21,
              shadowBoard: false,
              name: `Auto ${binCounter + 1}`,
              // Updated: use standardized cream colorway instead of cycling legacy colors
              colorway: 'cream',
              color: '#F5E6C8'
            };

            // Check if this placement is valid
            if (BinSortingService.checkValidPlacement(newBin, currentPlacedBins, gridCols, gridRows)) {
              // Add to both our tracking array and the actual bins array
              currentPlacedBins.push(newBin);
              newBins.push(newBin);
              addBin(newBin);
              binCounter++;
              canPlaceMore = true; // We placed a bin, so continue trying
              binPlaced = true;
              break; // Move to next gap after placing one bin
            }
          }
        }

        // If we placed a bin, break out of gap loop and recalculate gaps
        if (binPlaced) {
          break;
        }
      }
    }

    if (newBins.length > 0) {
      showCenterError(`Added ${newBins.length} auto-generated bins!`);
    } else {
      showCenterError('No suitable bin size found for available space');
    }
  };

  const handleReset = () => {
    pushUndoState();
    clearAllBins();
    setRemainingBins([...availableBins]);
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleReview = () => {
    if (placedBins.length === 0) {
      setErrorMessage('Please place at least one bin before proceeding.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const binsTotal = placedBins.reduce((sum, bin) => sum + calculateBinPrice(bin), 0);
    const baseplateTotal = calculateBaseplateCost(gridDimensions);
    
    const layoutData = {
      bins: placedBins,
      drawerDimensions: gridDimensions,
      totalCost: binsTotal + baseplateTotal,
      binsCost: binsTotal,
      baseplateCost: baseplateTotal
    };
    
    onLayoutComplete(layoutData);
    navigate('/review');
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBinId) {
          e.preventDefault();
          handleBinDelete(selectedBinId);
        }
      }
      if (e.key === 'Escape') {
        handlePanelClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBinId]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      
      // Re-apply orientation when viewport orientation changes
      if (drawerDimensions) {
        setDrawerDimensions(drawerDimensions);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawerDimensions, setDrawerDimensions]);

  // Live update handler for bin properties
  const handleBinLiveChange = (partialBin) => {
    const prevBin = placedBins.find(b => b.id === partialBin.id);
    if (prevBin) {
      const heightChanged = prevBin.height !== partialBin.height;
      const colorChanged = prevBin.color !== partialBin.color;
      const colorwayChanged = prevBin.colorway !== partialBin.colorway;
      // Only push undo for visual/size changes, never for name-only edits
      if (heightChanged || colorChanged || colorwayChanged) {
        pushUndoState();
      }
    }
    setPlacedBins(prev => prev.map(b => b.id === partialBin.id ? { ...b, ...partialBin } : b));
    if (selectedBin?.id === partialBin.id) {
      setSelectedBin(partialBin);
    }
  };

  // Auto-save placedBins to global data manager (debounced)
  const autoSaveTimerRef = useRef(null);
  const initialLoadRef = useRef(true);
  useEffect(() => {
    if (!dataManager || typeof dataManager.updateLayoutConfig !== 'function') return;
    // Skip the very first effect run right after mount/initial restore
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        dataManager.updateLayoutConfig(placedBins);
        // console.log('[AutoSave] layoutConfig updated with', placedBins.length, 'bins');
      } catch (e) {
        console.error('[AutoSave] Failed to save layout', e);
      }
    }, 400); // 400ms debounce
    return () => autoSaveTimerRef.current && clearTimeout(autoSaveTimerRef.current);
  }, [placedBins, dataManager]);

  return (
    <DesignerContainer>
      <LayoutMainColumns>
        <LeftColumn>
          <ActionButtons 
            onGenerateBins={handleGenerateBins}
            onReset={handleReset}
            onReview={handleReview}
            onUndo={handleUndo}
            hasPlacedBins={placedBins.length > 0 || undoStack.length > 0}
          />
        </LeftColumn>
        <CenterColumn>
          <DrawerContainer>
            <GridAndPanelContainer>
              <GridContainer>
                <GridSection>
                  <GridWrapper>
                    {errorMessage && (
                      <ErrorNotification style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, pointerEvents: 'none' }}>
                        {errorMessage}
                      </ErrorNotification>
                    )}
                    <GridBoundingBox 
                      width={gridBounds.width}
                      height={gridBounds.height}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '-2.2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 'bold',
                        color: '#374151',
                        fontSize: '1rem',
                        zIndex: 100
                      }}>
                        Grid: {gridCols} cols × {gridRows} rows (min: 1, max: {Math.floor(320 / GRID_SIZE)})
                      </div>
                      <BinGrid
                        ref={drop}
                        gridCols={gridCols}
                        gridRows={gridRows}
                        cellSize={cellPixelSize}
                        placedBins={placedBins}
                        selectedBin={selectedBin}
                        onBinClick={handleBinClick}
                        onBinDoubleClick={handleBinDoubleClick}
                        draggedBin={draggedBin}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        dropShadow={dropShadow}
                        onGridHover={handleGridHover}
                        onGridDrop={handleGridDrop}
                        drawingContainerRef={drawingContainerRef}
                        isDrawing={isDrawing}
                        drawingPreview={drawingPreview}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        underlayImage={underlayImage}
                      />
                    </GridBoundingBox>
                  </GridWrapper>

                  <InstructionText>
                    Click and drag to draw custom bins • Double-click bins to delete • Drop bins here to place them
                  </InstructionText>
                </GridSection>
              </GridContainer>
            </GridAndPanelContainer>
          </DrawerContainer>
        </CenterColumn>
        <RightColumn>
          <Drawer3DWrapper>
            <Drawer3DView drawerDimensions={gridDimensions} bins={placedBins} selectedBinId={selectedBin?.id} />
          </Drawer3DWrapper>
      <BinOptionsAccordion $open={!!selectedBin}>
            <BinOptionsPanel
        open={!!selectedBin}
              bin={selectedBin}
              onSave={handleBinSave}
              onLiveChange={handleBinLiveChange}
            />
          </BinOptionsAccordion>
        </RightColumn>
      </LayoutMainColumns>
      <ReviewButtonContainer>
        <ReviewButton onClick={handleReview} disabled={!placedBins.length}>
          Review Order
        </ReviewButton>
      </ReviewButtonContainer>

      {centerErrorMessage && (
        <CenterErrorMessage>
          {centerErrorMessage}
        </CenterErrorMessage>
      )}
    </DesignerContainer>
  );
}
