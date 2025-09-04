import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDrop } from 'react-dnd';
import { v4 as uuidv4 } from 'uuid';

// Modular imports
import { GRID_SIZE, STANDARD_BIN_SIZES, colors } from './LayoutDesigner.constants';
import { calculatePrice, calculateBinPrice } from './LayoutDesigner.utils';
import { 
  DesignerContainer,
  BinCarousel,
  CarouselContent,
  DrawerContainer,
  GridSection,
  GridAndPanelContainer,
  GridContainer,
  GridWrapper,
  ErrorNotification,
  CenterErrorMessage,
  InstructionText
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
import DraggableBin from './DraggableBin';
import BinModificationPanel from './BinModificationPanel';

export default function LayoutDesigner({ drawerDimensions, availableBins = [], onLayoutComplete }) {
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
    cellSize,
    setCellSize,
    gridCols,
    gridRows,
    calculateGridSize
  } = useLayoutGrid(drawerDimensions);

  // Update drawer dimensions when props change
  useEffect(() => {
    if (drawerDimensions) {
      setDrawerDimensions(drawerDimensions);
    }
  }, [drawerDimensions, setDrawerDimensions]);

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
    const panelWidth = selectedBin ? 320 : 0;
    const buttonWidth = 160;
    const isMobile = windowSize.width < 768;
    const gutterWidth = isMobile ? 32 : 80;
    const containerPadding = isMobile ? 32 : 64;
    const maxGridWidth = windowSize.width - gutterWidth - containerPadding - panelWidth - buttonWidth;
    
    calculateGridSize(maxGridWidth);
  }, [windowSize, selectedBin, calculateGridSize]);

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
  } = useBinDrawing(gridCols, gridRows, cellSize, placedBins, addBin);

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
    handleCarouselDragLeave
  } = useDragAndDrop(placedBins, setPlacedBins, gridCols, gridRows, cellSize, checkBounds, checkCollision);

  // State for remaining bins and errors
  const [remainingBins, setRemainingBins] = useState([...availableBins]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);

  // Utility function for center error messages
  const showCenterError = (message) => {
    setCenterErrorMessage(message);
    setTimeout(() => setCenterErrorMessage(null), 3000);
  };

  // Carousel drop zone setup
  const [, carouselDrop] = useDrop({
    accept: ['bin', 'placed-bin'],
    drop: handleCarouselDrop,
    hover: handleCarouselDragOver,
    collect: (monitor) => ({
      isCarouselDropTarget: monitor.isOver() && monitor.getItem()?.fromGrid,
    }),
  });

  // Main grid drop zone setup
  const [{ isOver }, drop] = useDrop({
    accept: 'bin',
    hover: (item, monitor) => {
      if (item.bin || item.placedBinId) {
        const gridElement = document.querySelector('[data-grid="true"]');
        const clientOffset = monitor.getClientOffset();
        
        if (gridElement && clientOffset) {
          const gridRect = gridElement.getBoundingClientRect();
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          
          const gridX = Math.floor(x / cellSize);
          const gridY = Math.floor(y / cellSize);
          
          handleGridHover(gridX, gridY);
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
        
        const gridX = Math.floor(x / cellSize);
        const gridY = Math.floor(y / cellSize);
        
        if (item.placedBinId) {
          // Moving existing bin
          const newX = gridX * GRID_SIZE;
          const newY = gridY * GRID_SIZE;
          
          if (isValidPlacement({ ...draggedBin, x: newX, y: newY }, item.placedBinId)) {
            moveBin(item.placedBinId, newX, newY);
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        } else if (item.bin) {
          // Placing new bin from carousel
          const newBin = {
            id: uuidv4(),
            originalId: item.bin.id,
            x: gridX * GRID_SIZE,
            y: gridY * GRID_SIZE,
            width: item.bin.width,
            length: item.bin.depth,
            height: 21,
            shadowBoard: false,
            name: item.bin.label,
            color: item.bin.color
          };

          if (isValidPlacement(newBin)) {
            addBin(newBin);
            setRemainingBins(prev => prev.filter(bin => bin.id !== item.bin.id));
          } else {
            showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
          }
        }
      }
    }
  });

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
    setPlacedBins(prev => prev.map(bin => 
      bin.id === updatedBin.id ? updatedBin : bin
    ));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleBinDelete = (binId) => {
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
        depth: bin.length,
        color: bin.color
      }));
      setRemainingBins(prev => [...prev, ...carouselBins]);
      showCenterError(`Sorted ${sortedBins.length} bins, ${unplacedBins.length} returned to carousel`);
    } else {
      showCenterError('All bins sorted successfully!');
    }
  };

  const handleGenerateBins = () => {
    const largestGap = BinSortingService.findLargestGap(gridCols, gridRows, placedBins);
    
    if (largestGap.area === 0) {
      showCenterError('No space available for additional bins');
      return;
    }

    const newBins = [];
    let binCounter = 0;

    // Try to fit standard bin sizes in the available space
    for (const binSize of STANDARD_BIN_SIZES) {
      const binWidthCells = Math.ceil(binSize.width / GRID_SIZE);
      const binHeightCells = Math.ceil(binSize.height / GRID_SIZE);

      if (binWidthCells <= largestGap.width && binHeightCells <= largestGap.height) {
        const newBin = {
          id: uuidv4(),
          x: largestGap.x * GRID_SIZE,
          y: largestGap.y * GRID_SIZE,
          width: binSize.width,
          length: binSize.height,
          height: 21,
          shadowBoard: false,
          name: `Auto ${binCounter + 1}`,
          color: colors[binCounter % colors.length]
        };

        if (isValidPlacement(newBin)) {
          addBin(newBin);
          newBins.push(newBin);
          binCounter++;
          break; // Only add one bin at a time
        }
      }
    }

    if (newBins.length > 0) {
      showCenterError(`Added ${newBins.length} auto-generated bin!`);
    } else {
      showCenterError('No suitable bin size found for available space');
    }
  };

  const handleReset = () => {
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

    const layoutData = {
      bins: placedBins,
      drawerDimensions: gridDimensions,
      totalCost: placedBins.reduce((sum, bin) => sum + calculateBinPrice(bin), 0)
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
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DesignerContainer>
      <BinCarousel ref={carouselDrop} isCarouselDropTarget={isCarouselDropTarget}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
          Available Bins {isCarouselDropTarget && '(Drop here to store)'}
        </h3>
        <CarouselContent>
          {remainingBins.map((bin) => (
            <DraggableBin key={bin.id} bin={bin} />
          ))}
          {remainingBins.length === 0 && (
            <p style={{ color: '#6b7280', margin: 0 }}>All bins have been placed</p>
          )}
        </CarouselContent>
      </BinCarousel>

      <DrawerContainer>
        <GridAndPanelContainer>
          <GridContainer>
            <GridSection>
              <GridWrapper>
                <ActionButtons 
                  onAutoSort={handleAutoSort}
                  onGenerateBins={handleGenerateBins}
                  onReset={handleReset}
                  onReview={handleReview}
                  hasPlacedBins={placedBins.length > 0}
                />

                <BinGrid
                  gridCols={gridCols}
                  gridRows={gridRows}
                  cellSize={cellSize}
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
                />
              </GridWrapper>

              <InstructionText>
                Click and drag to draw custom bins • Double-click bins to delete • Drop bins here to place them
              </InstructionText>
            </GridSection>
          </GridContainer>

          <BinModificationPanel
            open={!!selectedBin}
            bin={selectedBin}
            onClose={handlePanelClose}
            onSave={handleBinSave}
            onDelete={handleBinDelete}
          />
        </GridAndPanelContainer>
      </DrawerContainer>

      {errorMessage && (
        <ErrorNotification>
          {errorMessage}
        </ErrorNotification>
      )}

      {centerErrorMessage && (
        <CenterErrorMessage>
          {centerErrorMessage}
        </CenterErrorMessage>
      )}
    </DesignerContainer>
  );
}
