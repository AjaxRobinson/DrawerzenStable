import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';

// Import Supabase Service
import SupabaseService from '../../services/SupabaseService'; 
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
  BinOptionsAccordion,
  media
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

export default function LayoutDesigner({ 
  drawerDimensions, 
  availableBins = [], 
  onLayoutComplete, 
  initialLayout, 
  underlayImage, 
  dataManager,
  projectId // Add this new prop for Supabase project identification
}) {
  const navigate = useNavigate();
  const [undoStack, setUndoStack] = useState([]);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);
  const [remainingBins, setRemainingBins] = useState(() => [...availableBins]);
  const [isSaving, setIsSaving] = useState(false); // Add saving state
  // Create stable drawer config
  const drawerConfig = useMemo(() => {
    if (!drawerDimensions) return { width: 320, length: 320, maxWidth: 320, maxLength: 320 };
    return {
      ...drawerDimensions,
      maxWidth: 320,
      maxLength: 320
    };
  }, [drawerDimensions?.width, drawerDimensions?.length]);

  // Layout grid hook with stable config
  const {
    drawerDimensions: gridDimensions,
    setDrawerDimensions,
    cellPixelSize,
    gridBounds,
    gridCols,
    gridRows,
    calculateGridSize
  } = useLayoutGrid(drawerConfig);

  // Update drawer dimensions when props change
  useEffect(() => {
    if (drawerDimensions) {
      setDrawerDimensions(drawerDimensions);
    }
  }, [drawerDimensions?.width, drawerDimensions?.length]);



  // Bin management hook with size limits (1-15 units)
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

  // Restore bins from initialLayout when available
  useEffect(() => {
    if (initialLayout && Array.isArray(initialLayout) && initialLayout.length > 0) {
      const restoredBins = initialLayout.map(item => ({
        id: item.id || uuidv4(),
        originalId: item.originalId || item.id,
        x: item.x || 0,
        y: item.y || 0,
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
  }, [JSON.stringify(initialLayout || [])]);

  // Update remaining bins when available bins change
  useEffect(() => {
    const availableBinsString = JSON.stringify(availableBins.map(b => ({id: b.id, width: b.width, length: b.length})).sort());
    const remainingBinsString = JSON.stringify(remainingBins.map(b => ({id: b.id, width: b.width, length: b.length})).sort());
    
    if (availableBinsString !== remainingBinsString) {
      setRemainingBins([...availableBins]);
    }
  }, [JSON.stringify(availableBins.map(b => ({id: b.id, width: b.width, length: b.length})).sort())]);

  // Calculate responsive cell size
  useEffect(() => {
    const buttonWidth = 160;
    const isMobile = windowSize.width < 768;
    const gutterWidth = isMobile ? 32 : 80;
    const containerPadding = isMobile ? 32 : 64;

    const maxGridWidth = windowSize.width - gutterWidth - containerPadding - buttonWidth;
    const maxGridHeight = (windowSize.height - 80) * 0.65;

    calculateGridSize(maxGridWidth, maxGridHeight);
  }, [windowSize.width, windowSize.height]);

  // Utility functions
  const showCenterError = useCallback((message) => {
    setCenterErrorMessage(message);
    requestAnimationFrame(() => {
      setTimeout(() => setCenterErrorMessage(null), 3000);
    });
  }, []);

  const pushUndoState = useCallback(() => {
    setUndoStack(prev => [
      { placedBins: [...placedBins], remainingBins: [...remainingBins] },
      ...prev.slice(0, 49)
    ]);
  }, [JSON.stringify(placedBins), JSON.stringify(remainingBins)]);

  // Undo handler
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) {
      showCenterError('Nothing to undo');
      return;
    }
    const lastState = undoStack[0];
    const currentNames = new Map(placedBins.map(b => [b.id, b.name]));
    const restoredBins = lastState.placedBins.map(b => ({ ...b, name: currentNames.get(b.id) ?? b.name }));
    setPlacedBins(restoredBins);
    setRemainingBins(lastState.remainingBins);
    setUndoStack(prev => prev.slice(1));
    setSelectedBin(null);
    setSelectedBinId(null);
  }, [undoStack, JSON.stringify(placedBins), setPlacedBins, setSelectedBin]);

  // Manual save to Supabase function
  const handleSaveToSupabase = useCallback(async () => {
    if (!projectId) {
      showCenterError('Project ID is required to save bins');
      return;
    }

    if (!SupabaseService.isEnabled()) {
      showCenterError('Supabase service is not configured');
      return;
    }

    if (placedBins.length === 0) {
      showCenterError('No bins to save');
      return;
    }

    setIsSaving(true);
    try {
      const result = await SupabaseService.saveBins(projectId, placedBins);
      
      if (result.success) {
        showCenterError(`✅ Saved ${placedBins.length} bins to database!`);
      } else {
        showCenterError(`❌ Failed to save bins: ${result.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save to Supabase error:', error);
      showCenterError(`❌ Error saving bins: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, placedBins, showCenterError]);

  // Auto-save to Supabase when bins change (debounced)
  const lastSavedLayoutRef = useRef(JSON.stringify(placedBins));
const saveTimeoutRef = useRef(null);
const saveInProgressRef = useRef(false);

useEffect(() => {
  if (!projectId || !SupabaseService.isEnabled()) return;
  
  const currentLayoutString = JSON.stringify(placedBins);
  
  // Clear previous timeout
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current);
  }

  // Only save if layout actually changed and no save is in progress
  if (lastSavedLayoutRef.current !== currentLayoutString && !saveInProgressRef.current) {
    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(async () => {
      if (saveInProgressRef.current) return; // Prevent concurrent saves
      
      saveInProgressRef.current = true;
      try {
        console.log('[AutoSave] Starting save operation...');
        
        // Save to local data manager first
        if (dataManager && typeof dataManager.updateLayoutConfig === 'function') {
          dataManager.updateLayoutConfig(placedBins);
        }
        
        // Save to Supabase
        const result = await SupabaseService.saveBins(projectId, placedBins);
        
        if (result.success) {
          console.log(`[AutoSave] ✅ ${placedBins.length} bins saved successfully`);
          lastSavedLayoutRef.current = currentLayoutString;
        } else {
          console.error('[AutoSave] ❌ Failed to save bins:', result.error);
        }
      } catch (error) {
        console.error('[AutoSave] ❌ Error saving bins:', error);
      } finally {
        saveInProgressRef.current = false;
      }
    }, 2000); // 2 second debounce
  }

  // Cleanup timeout on unmount
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
  };
}, [JSON.stringify(placedBins), projectId, dataManager]);

  // Bin drawing hook
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
  } = useBinDrawing(gridCols, gridRows, placedBins, setPlacedBins, GRID_SIZE, pushUndoState);

  // Drag and drop hook with proper hover handling
  const {
    draggedBin,
    dropShadow,
    handleDragStart,
    handleDragEnd,
    handleGridHover,
    handleGridDrop,
    handleCarouselDragOver,
    setDropShadow
  } = useDragAndDrop(placedBins, setPlacedBins, gridCols, gridRows, cellPixelSize, checkBounds, checkCollision);

  // Carousel drop zone setup
  const [, carouselDrop] = useDrop(() => ({
    accept: ['bin', 'placed-bin'],
    drop: (item) => {
      if (item.placedBinId) {
        const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
        if (binToMove) {
          setPlacedBins(prev => prev.filter(bin => bin.id !== item.placedBinId));
          
          const originalBin = availableBins.find(b => b.id === binToMove.originalId) || {
            id: binToMove.originalId || binToMove.id,
            label: binToMove.name,
            width: binToMove.width,
            length: binToMove.length,
            color: binToMove.color
          };
          
          setRemainingBins(prev => [...prev, originalBin]);
        }
      }
    },
    hover: handleCarouselDragOver,
    collect: (monitor) => ({
      isCarouselDropTarget: monitor.isOver() && monitor.getItem()?.placedBinId,
    }),
  }), [JSON.stringify(placedBins), JSON.stringify(availableBins), setPlacedBins, setRemainingBins, handleCarouselDragOver]);

  // Main grid drop zone setup with proper hover visualization and size limits
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['bin', 'placed-bin'],
    hover: (item, monitor) => {
      if (item.bin || item.placedBinId) {
        const gridElement = document.querySelector('[data-grid="true"]');
        const clientOffset = monitor.getClientOffset();
        
        if (gridElement && clientOffset) {
          const gridRect = gridElement.getBoundingClientRect();
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          
          // Calculate grid position in 21mm increments
          const gridX = Math.floor(x / cellPixelSize);
          const gridY = Math.floor(y / cellPixelSize);
          
          // Convert to millimeter coordinates
          const mmX = gridX * GRID_SIZE;
          const mmY = gridY * GRID_SIZE;
          
          // Create virtual dragged bin for carousel items
          let currentDraggedBin = draggedBin;
          
          if (item.bin && !currentDraggedBin) {
            // Bin from carousel - create temporary dragged bin
            currentDraggedBin = {
              id: item.bin.id,
              width: item.bin.width,
              length: item.bin.length,
              x: mmX,
              y: mmY
            };
          }
          
          if (currentDraggedBin) {
            const newBin = { 
              ...currentDraggedBin, 
              x: mmX, 
              y: mmY 
            };
            
            // Check if placement is valid (within 1-15 grid limits)
            const isValid = checkBounds(newBin) && 
                           !checkCollision(newBin, currentDraggedBin.id) &&
                           newBin.x >= 0 && 
                           newBin.y >= 0 &&
                           (newBin.x + newBin.width) <= (gridCols * GRID_SIZE) &&
                           (newBin.y + newBin.length) <= (gridRows * GRID_SIZE);

            // Convert to pixel positions for visual feedback
            const pixelX = (mmX / GRID_SIZE) * cellPixelSize;
            const pixelY = (mmY / GRID_SIZE) * cellPixelSize;
            const pixelWidth = (currentDraggedBin.width / GRID_SIZE) * cellPixelSize;
            const pixelHeight = (currentDraggedBin.length / GRID_SIZE) * cellPixelSize;

            // Update drop shadow for visual feedback
            setDropShadow({
              left: pixelX,
              top: pixelY,
              width: pixelWidth,
              height: pixelHeight,
              visible: true,
              error: !isValid
            });
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
        
        // Calculate grid position in 21mm increments
        const gridX = Math.floor(x / cellPixelSize);
        const gridY = Math.floor(y / cellPixelSize);
        
        if (item.placedBinId) {
          // Moving existing bin
          const newX = gridX * GRID_SIZE;
          const newY = gridY * GRID_SIZE;
          
          // Validate placement within grid bounds (1-15 units)
          const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
          if (binToMove) {
            const updatedBin = { ...binToMove, x: newX, y: newY };
            if (isValidPlacement(updatedBin, item.placedBinId) &&
                newX >= 0 && 
                newY >= 0 &&
                (newX + binToMove.width) <= (gridCols * GRID_SIZE) &&
                (newY + binToMove.length) <= (gridRows * GRID_SIZE)) {
              pushUndoState();
              moveBin(item.placedBinId, newX, newY);
            } else {
              showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
            }
          }
        } else if (item.bin) {
          // Placing new bin from carousel
          const newBin = {
            id: uuidv4(),
            originalId: item.bin.id,
            x: gridX * GRID_SIZE,
            y: gridY * GRID_SIZE,
            width: item.bin.width,
            length: item.bin.length,
            height: 21,
            shadowBoard: false,
            name: item.bin.label,
            color: item.bin.color,
            colorway: 'cream'
          };

          // Validate placement within grid bounds (1-15 units)
          if (isValidPlacement(newBin) &&
              newBin.x >= 0 && 
              newBin.y >= 0 &&
              (newBin.x + newBin.width) <= (gridCols * GRID_SIZE) &&
              (newBin.y + newBin.length) <= (gridRows * GRID_SIZE)) {
            pushUndoState();
            addBin(newBin);
            setRemainingBins(prev => prev.filter(bin => bin.id !== item.bin.id));
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        }
      }
      
      // Clear drop shadow after drop
      setDropShadow(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }), [
    cellPixelSize,
    draggedBin,
    isValidPlacement,
    pushUndoState,
    moveBin,
    showCenterError,
    addBin,
    setRemainingBins,
    JSON.stringify(placedBins),
    checkBounds,
    checkCollision,
    setDropShadow,
    gridCols,
    gridRows
  ]);

  // Clear drop shadow when not hovering over grid
  useEffect(() => {
    if (!isOver) {
      setDropShadow(null);
    }
  }, [isOver, setDropShadow]);

  // Bin event handlers
  const handleBinClick = useCallback((bin) => {
    selectBin(bin);
    setSelectedBinId(bin.id);
  }, [selectBin]);

  const handleBinDoubleClick = useCallback((bin) => {
    removeBin(bin.id);
    
    const originalBin = availableBins.find(b => b.id === bin.originalId);
    if (originalBin) {
      setRemainingBins(prev => [...prev, originalBin]);
    }
  }, [removeBin, JSON.stringify(availableBins), setRemainingBins]);

  const handleBinSave = useCallback((updatedBin) => {
    const prevBin = placedBins.find(b => b.id === updatedBin.id);
    if (prevBin) {
      const affectsUndo = prevBin.height !== updatedBin.height || 
                         prevBin.colorway !== updatedBin.colorway || 
                         prevBin.color !== updatedBin.color;
      if (affectsUndo) pushUndoState();
    }
    setPlacedBins(prev => prev.map(bin => bin.id === updatedBin.id ? updatedBin : bin));
    setSelectedBin(null);
    setSelectedBinId(null);
  }, [placedBins, pushUndoState, setPlacedBins, setSelectedBin]);

  const handleBinDelete = useCallback((binId) => {
    pushUndoState();
    const binToDelete = placedBins.find(bin => bin.id === binId);
    if (binToDelete) {
      handleBinDoubleClick(binToDelete);
    }
    setSelectedBin(null);
    setSelectedBinId(null);
  }, [pushUndoState, placedBins, handleBinDoubleClick, setSelectedBin]);

  const handlePanelClose = useCallback(() => {
    setSelectedBin(null);
    setSelectedBinId(null);
  }, [setSelectedBin]);

  // Action button handlers with size validation
  const handleAutoSort = useCallback(() => {
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
  }, [pushUndoState, JSON.stringify(placedBins), gridCols, gridRows, setPlacedBins, setRemainingBins, showCenterError]);

  const handleGenerateBins = useCallback(() => {
    pushUndoState();
    const newBins = [];
    let binCounter = 0;
    let currentPlacedBins = [...placedBins];
    
    let canPlaceMore = true;
    let iterations = 0;
    const maxIterations = 200;
    
    while (canPlaceMore && iterations < maxIterations) {
      iterations++;
      canPlaceMore = false;
      
      // Find all available gaps within 1-15 grid limits
      const gaps = BinSortingService.findAllGaps(gridCols, gridRows, currentPlacedBins, 2);
      
      if (gaps.length === 0) {
        break;
      }

      for (const gap of gaps) {
        // Ensure gap is within valid grid bounds (1-15 units)
        if (gap.x >= 0 && gap.y >= 0 && 
            (gap.x + gap.width) <= gridCols && 
            (gap.y + gap.height) <= gridRows) {
          
          const gapWidthMM = gap.width * GRID_SIZE;
          const gapHeightMM = gap.height * GRID_SIZE;

          let binPlaced = false;
          for (const binSize of STANDARD_BIN_SIZES) {
            // Check if bin fits in the gap and within size limits
            if (binSize.width <= gapWidthMM && binSize.length <= gapHeightMM) {
              const newBin = {
                id: uuidv4(),
                x: gap.x * GRID_SIZE,
                y: gap.y * GRID_SIZE,
                width: binSize.width,
                length: binSize.length,
                height: 21,
                shadowBoard: false,
                name: `Auto ${binCounter + 1}`,
                colorway: 'cream',
                color: '#F5E6C8'
              };

              // Validate placement within grid bounds
              if (BinSortingService.checkValidPlacement(newBin, currentPlacedBins, gridCols, gridRows) &&
                  newBin.x >= 0 && 
                  newBin.y >= 0 &&
                  (newBin.x + newBin.width) <= (gridCols * GRID_SIZE) &&
                  (newBin.y + newBin.length) <= (gridRows * GRID_SIZE)) {
                currentPlacedBins.push(newBin);
                newBins.push(newBin);
                addBin(newBin);
                binCounter++;
                canPlaceMore = true;
                binPlaced = true;
                break;
              }
            }
          }

          if (binPlaced) {
            break;
          }
        }
      }
    }

    if (newBins.length > 0) {
      showCenterError(`Added ${newBins.length} auto-generated bins!`);
    } else {
      showCenterError('No suitable bin size found for available space');
    }
  }, [pushUndoState, JSON.stringify(placedBins), gridCols, gridRows, addBin, showCenterError]);

  const handleReset = useCallback(() => {
    pushUndoState();
    clearAllBins();
    setRemainingBins([...availableBins]);
    setSelectedBin(null);
    setSelectedBinId(null);
  }, [pushUndoState, clearAllBins, JSON.stringify(availableBins), setRemainingBins, setSelectedBin]);

  const handleReview = useCallback(() => {
    if (placedBins.length === 0) {
      setErrorMessage('Please place at least one bin before proceeding.');
      requestAnimationFrame(() => {
        setTimeout(() => setErrorMessage(null), 3000);
      });
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
  }, [JSON.stringify(placedBins), gridDimensions?.width, gridDimensions?.length, setErrorMessage, onLayoutComplete, navigate]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBinId) {
        e.preventDefault();
        handleBinDelete(selectedBinId);
      }
      if (e.key === 'Escape') {
        handlePanelClose();
      }
      // Add Ctrl+S or Cmd+S for manual save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveToSupabase();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBinId, handleBinDelete, handlePanelClose, handleSaveToSupabase]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Live update handler for bin properties
  const handleBinLiveChange = useCallback((partialBin) => {
    const prevBin = placedBins.find(b => b.id === partialBin.id);
    if (prevBin) {
      const heightChanged = prevBin.height !== partialBin.height;
      const colorChanged = prevBin.color !== partialBin.color;
      const colorwayChanged = prevBin.colorway !== partialBin.colorway;
      if (heightChanged || colorChanged || colorwayChanged) {
        pushUndoState();
      }
    }
    setPlacedBins(prev => prev.map(b => b.id === partialBin.id ? { ...b, ...partialBin } : b));
    if (selectedBin?.id === partialBin.id) {
      setSelectedBin(partialBin);
    }
  }, [placedBins, pushUndoState, setPlacedBins, selectedBin, setSelectedBin]);

  // Memoize expensive calculations
  const hasPlacedBins = useMemo(() => 
    placedBins.length > 0 || undoStack.length > 0, 
    [placedBins.length, undoStack.length]
  );

  // Calculate image positioning to ensure bins are visible
  const backgroundImageStyle = useMemo(() => {
    if (!underlayImage) return {};
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: `url(${underlayImage})`,
      backgroundSize: '100% 100%',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      pointerEvents: 'none',
      zIndex: 1
    };
  }, [underlayImage]);

  return (
    <DesignerContainer>
      <LayoutMainColumns>
        <LeftColumn>
          <ActionButtons 
            onGenerateBins={handleGenerateBins}
            onReset={handleReset}
            onReview={handleReview}
            onUndo={handleUndo}
            onSave={handleSaveToSupabase} 
            isSaving={isSaving} 
            hasPlacedBins={hasPlacedBins}
          />
        </LeftColumn>
        <CenterColumn>
          <DrawerContainer>
            <GridAndPanelContainer>
              <GridContainer>
                <GridSection>
                  <GridWrapper
             width={Math.round(gridBounds?.width) || 0}
             height={Math.round(gridBounds?.height) || 0}
                  >
                    {errorMessage && (
                      <ErrorNotification style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        zIndex: 1000, 
                        pointerEvents: 'none' 
                      }}>
                        {errorMessage}
                      </ErrorNotification>
                    )}
                    <GridBoundingBox 
                      width={Math.round(gridBounds?.width) || 0}
                      height={Math.round(gridBounds?.height) || 0}
                      style={backgroundImageStyle}
                    >
                      {/* <div style={{
                        position: 'absolute',
                        top: '-2.2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 'bold',
                        color: '#374151',
                        fontSize: '1rem',
                        zIndex: 100,
                        ...(window.innerWidth <= 480 ? { fontSize: '0.8rem',top: '-1.8rem',}: {})
                      }}>
                        Grid: {gridCols} cols × {gridRows} rows (min: 1, max: 15)
                      </div> */}
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
                    {projectId && (
                      <span style={{ display: 'block', marginTop: '4px', fontSize: '0.85rem' }}>
                        💾 Auto-saving enabled for project: {projectId.substring(0, 8)}...
                      </span>
                    )}
                  </InstructionText>
                </GridSection>
              </GridContainer>
            </GridAndPanelContainer>
          </DrawerContainer>
        </CenterColumn>
        <RightColumn>
          <Drawer3DWrapper>
            <Drawer3DView 
              drawerDimensions={gridDimensions} 
              bins={placedBins} 
              selectedBinId={selectedBin?.id} 
            />
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