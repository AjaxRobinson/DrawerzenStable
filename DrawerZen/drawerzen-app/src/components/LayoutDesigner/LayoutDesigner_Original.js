import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDrop, useDrag } from 'react-dnd';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import DraggableBin from './DraggableBin';
import GridCell from './GridCell';
import BinModificationPanel from './BinModificationPanel';

// Constants
const GRID_SIZE = 21; // 21mm precision
const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

// Helper Functions
function calculatePrice(bin, customization = {}) {
  const cellsX = Math.ceil(bin.width / GRID_SIZE);
  const cellsY = Math.ceil(bin.depth / GRID_SIZE);
  const numCells = cellsX * cellsY;
  let pricePerCell = 0.10;
  
  const heightMultiplier = (customization.height || 10) / 10;
  pricePerCell = pricePerCell * heightMultiplier;
  
  if (customization.shadowBoarded) pricePerCell += 0.10;
  return Math.round(numCells * pricePerCell * 100) / 100;
}

function calculateBinPrice(bin) {
  if (!bin || !bin.width || !bin.length) return 0;
  
  const cellsX = Math.ceil(bin.width / 21);
  const cellsY = Math.ceil(bin.length / 21);
  const numCells = cellsX * cellsY;
  
  let pricePerCell = 0.05;
  
  if (bin.height > 21) {
    const extraHeight = bin.height - 21;
    const heightMultiplier = 1 + (extraHeight / 21) * 0.5;
    pricePerCell *= heightMultiplier;
  }
  
  let shadowBoardCost = 0;
  if (bin.shadowBoard) {
    shadowBoardCost = 3.00;
  }
  
  return Math.round((numCells * pricePerCell + shadowBoardCost) * 100) / 100;
}

// Styled Components
const DesignerContainer = styled.div`
  width: 100vw;
  height: calc(100vh - 80px); /* Account for nav bar height */
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  margin-top: 80px; /* Position below nav bar */
  box-sizing: border-box;
  overflow: hidden;
  max-width: 100%;
  
  * {
    box-sizing: border-box;
  }
  
  @media (max-width: 768px) {
    height: calc(100vh - 70px);
    margin-top: 70px;
  }
`;

const BinCarousel = styled.div`
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin: 0.5rem 2rem 0.5rem 2rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
  height: 15vh; /* 15% of remaining viewport height after nav bar */
  width: calc(100vw - 6rem);
  max-width: calc(100vw - 6rem);
  border: ${props => props.isCarouselDropTarget ? '2px dashed #4f46e5' : '2px solid transparent'};
  background: ${props => props.isCarouselDropTarget ? '#f0f9ff' : 'white'};
  transition: all 0.2s ease;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    margin: 0.5rem 1rem 0.5rem 1rem;
    width: calc(100vw - 4rem);
    max-width: calc(100vw - 4rem);
    padding: 0.5rem 0.75rem;
    height: 12vh; /* 12% of remaining viewport height on mobile */
  }
  
  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    
    @media (max-width: 768px) {
      font-size: 0.8rem;
      margin: 0 0 0.5rem 0;
    }
  }
`;

const CarouselContent = styled.div`
  display: flex;
  gap: 0.5rem;
  min-width: min-content;
  padding-bottom: 0;
`;

const DrawerContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin: 0.5rem 2rem 0.5rem 2rem;
  height: 84vh; /* 84% of remaining viewport height after nav bar */
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  min-height: 0;
  max-width: calc(100vw - 6rem);
  box-sizing: border-box;
  flex: 1;
  
  @media (max-width: 768px) {
    margin: 0.5rem 1rem 0.5rem 1rem;
    max-width: calc(100vw - 4rem);
    padding: 0.75rem;
    height: 87vh; /* 87% of remaining viewport height on mobile */
  }
`;

const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  position: relative;
  align-items: center;
`;

const GridAndPanelContainer = styled.div`
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 100%;
  overflow: hidden;
`;

const GridContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  flex: 1;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  width: 140px;
  position: absolute;
  left: -160px; /* Position to the left of the grid */
  top: 0;
  z-index: 20;
  
  @media (max-width: 768px) {
    width: 120px;
    gap: 0.5rem;
    left: -140px;
  }
`;

const GridWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  max-width: 100%;
  overflow: hidden;
  position: relative; /* For positioning action buttons */
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.cols}, ${props => props.cellSize}px);
  grid-template-rows: repeat(${props => props.rows}, ${props => props.cellSize}px);
  gap: 1px;
  background: #e2e8f0;
  padding: 1px;
  border-radius: 4px;
  position: relative;
  
  canvas {
    width: 100% !important;
    height: 100% !important;
    min-width: unset !important;
  }
`;

const PlacedBin = styled.div`
  position: absolute;
  background: ${props => props.color || '#3b82f6'};
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: all 0.2s;
  z-index: 15;
  border: 2px solid ${props => {
    const color = props.color || '#3b82f6';
    // Convert hex to RGB and darken
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 40);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 40);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 40);
    return `rgb(${r}, ${g}, ${b})`;
  }};
  opacity: ${props => props.isDragging ? 0.6 : 1};
  transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1)'};
  pointer-events: auto;
  
  &:hover {
    transform: ${props => props.isDragging ? 'scale(1.05)' : 'scale(1.02)'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  ${props => props.selected && `
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px #fbbf24;
  `}
`;

const PrimaryButton = styled.button`
  padding: 0.625rem 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  font-size: 0.8rem;
  
  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

const SecondaryButton = styled.button`
  padding: 0.625rem 1rem;
  background: white;
  color: #4f46e5;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  font-size: 0.8rem;
  
  &:hover {
    background: #4f46e5;
    color: white;
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
  }
`;

const DrawingPreview = styled.div`
  position: absolute;
  border: 2px dashed #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  pointer-events: none;
  z-index: 8;
  border-radius: 2px;
  
  ${props => props.error && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  `}
`;

const DrawingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  cursor: crosshair;
  pointer-events: auto;
`;

const DropShadow = styled.div`
  position: absolute;
  border: 2px dashed #10b981;
  background: rgba(16, 185, 129, 0.15);
  pointer-events: none;
  z-index: 10;
  border-radius: 4px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
  
  ${props => props.error && `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  `}
`;

const ErrorNotification = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fee2e2;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: centerFadeIn 0.3s ease-out;
  
  @keyframes centerFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;

const CenterErrorMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fef3c7;
  color: #92400e;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #fde68a;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  animation: centerFadeIn 0.3s ease-out, centerFadeOut 0.3s ease-out 2.7s forwards;
  
  @keyframes centerFadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  
  @keyframes centerFadeOut {
    to { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  }
`;

// Draggable Placed Bin Component
function DraggablePlacedBin({ bin, selected, cellSize, onBinClick, onBinDoubleClick }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'bin',
    item: { 
      bin, 
      placedBinId: bin.id,
      fromGrid: true 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  return (
    <PlacedBin
      ref={drag}
      className="placed-bin"
      color={bin.color}
      selected={selected}
      isDragging={isDragging}
      style={{
        left: (bin.x / GRID_SIZE) * cellSize,
        top: (bin.y / GRID_SIZE) * cellSize,
        width: (bin.width / GRID_SIZE) * cellSize,
        height: (bin.length / GRID_SIZE) * cellSize,
      }}
      onMouseDown={(e) => {
        e.stopPropagation(); // Prevent drawing when clicking on bins
      }}
      onClick={(e) => {
        e.stopPropagation();
        onBinClick(bin);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onBinDoubleClick(bin);
      }}
    >
      {bin.name || `${bin.width}×${bin.length}`}
    </PlacedBin>
  );
}

export default function LayoutDesigner({ drawerDimensions, availableBins = [], onLayoutComplete }) {
  const [selectedBin, setSelectedBin] = useState(null);
  const navigate = useNavigate();
  const [placedBins, setPlacedBins] = useState([]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [remainingBins, setRemainingBins] = useState([...availableBins]); // Create a copy
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [drawingError, setDrawingError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);
  const [dropShadow, setDropShadow] = useState({ visible: false, x: 0, y: 0, width: 0, height: 0, error: false });

  // Window size state for responsive grid
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Calculate grid dimensions with responsive sizing
  const panelWidth = selectedBinId ? 320 : 0;
  const buttonWidth = 160; // Width of action buttons container plus space
  const isMobile = windowSize.width < 768;
  const gutterWidth = isMobile ? 32 : 80; // Smaller gutters on mobile
  const containerPadding = isMobile ? 32 : 64; // Smaller padding on mobile
  const maxGridWidth = windowSize.width - gutterWidth - containerPadding - panelWidth - buttonWidth;
  const maxGridHeight = (windowSize.height - 80) * 0.65; // Use 65% of remaining viewport height for grid area after nav
  
  const gridCols = Math.floor(drawerDimensions.width / GRID_SIZE);
  const gridRows = Math.floor(drawerDimensions.depth / GRID_SIZE);
  
  // Calculate responsive cell size to fit everything on screen
  const maxCellSizeX = Math.floor(maxGridWidth / gridCols);
  const maxCellSizeY = Math.floor(maxGridHeight / gridRows);
  const baseCellSize = Math.min(maxCellSizeX, maxCellSizeY, 18); // Reduced max size for better viewport fit
  
  // Ensure minimum cell size for usability, but allow smaller on mobile
  const minCellSize = windowSize.width < 768 ? 8 : 10;
  const cellSize = Math.max(baseCellSize, minCellSize);
  
  // Calculate actual grid dimensions
  const gridPixelWidth = gridCols * cellSize;
  const gridPixelHeight = gridRows * cellSize;

  const showCenterError = (message) => {
    setCenterErrorMessage(message);
    setTimeout(() => setCenterErrorMessage(null), 3000);
  };

  const [{ isOver }, drop] = useDrop({
    accept: 'bin',
    hover: (item, monitor) => {
      // Show drop shadow while hovering
      if (item.bin || item.placedBinId) {
        const gridElement = document.querySelector('[data-grid="true"]');
        const clientOffset = monitor.getClientOffset();
        
        if (gridElement && clientOffset) {
          const gridRect = gridElement.getBoundingClientRect();
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          
          // Calculate grid position
          const gridX = Math.floor(x / cellSize);
          const gridY = Math.floor(y / cellSize);
          
          // Get bin dimensions
          let binWidth, binHeight;
          if (item.placedBinId) {
            // Existing bin being moved (check this first since placed bins also have item.bin)
            const bin = placedBins.find(b => b.id === item.placedBinId);
            if (bin) {
              binWidth = bin.width;
              binHeight = bin.length;
            }
          } else if (item.bin) {
            // New bin from carousel
            binWidth = item.bin.width;
            binHeight = item.bin.depth;
          }
          
          if (binWidth && binHeight) {
            const shadowX = gridX * cellSize;
            const shadowY = gridY * cellSize;
            const shadowWidth = (binWidth / GRID_SIZE) * cellSize;
            const shadowHeight = (binHeight / GRID_SIZE) * cellSize;
            
            // Check if placement would be valid
            const testBin = {
              x: gridX * GRID_SIZE,
              y: gridY * GRID_SIZE,
              width: binWidth,
              length: binHeight
            };
            
            const isValid = canPlaceBin(testBin, item.placedBinId);
            
            setDropShadow({
              visible: true,
              x: shadowX,
              y: shadowY,
              width: shadowWidth,
              height: shadowHeight,
              error: !isValid
            });
          }
        }
      }
    },
    drop: (item, monitor) => {
      // Hide drop shadow
      setDropShadow({ visible: false, x: 0, y: 0, width: 0, height: 0, error: false });
      
      // Get the drop position relative to the grid
      const gridElement = monitor.getDropResult()?.gridElement || monitor.getDropResult();
      
      if (!gridElement) {
        // Calculate position relative to the grid directly
        const gridRect = document.querySelector('[data-grid="true"]')?.getBoundingClientRect();
        const clientOffset = monitor.getClientOffset();
        
        if (gridRect && clientOffset) {
          const x = clientOffset.x - gridRect.left;
          const y = clientOffset.y - gridRect.top;
          handleBinDrop(item, x, y);
        }
        return;
      }
      
      if (gridElement.x !== undefined && gridElement.y !== undefined) {
        handleBinDrop(item, gridElement.x, gridElement.y);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Carousel drop zone
  const [{ isCarouselDropTarget }, carouselDrop] = useDrop({
    accept: 'bin',
    hover: (item, monitor) => {
      // Hide drop shadow when hovering over carousel
      if (item.fromGrid) {
        setDropShadow({ visible: false, x: 0, y: 0, width: 0, height: 0, error: false });
      }
    },
    drop: (item) => {
      // Hide drop shadow
      setDropShadow({ visible: false, x: 0, y: 0, width: 0, height: 0, error: false });
      
      // Handle dropping bin back to carousel
      if (item.fromGrid && item.placedBinId) {
        handleBinReturnToCarousel(item.placedBinId);
      }
    },
    collect: (monitor) => ({
      isCarouselDropTarget: monitor.isOver() && monitor.getItem()?.fromGrid,
    }),
  });

  const handleBinReturnToCarousel = (placedBinId) => {
    const binToReturn = placedBins.find(bin => bin.id === placedBinId);
    if (binToReturn) {
      // Remove from placed bins
      setPlacedBins(prev => prev.filter(bin => bin.id !== placedBinId));
      
      // Add back to available bins if it was originally from availableBins
      const originalBin = availableBins.find(bin => bin.id === binToReturn.originalId);
      if (originalBin) {
        setRemainingBins(prev => [...prev, originalBin]);
      } else {
        // For custom drawn bins, convert back to a carousel-friendly format
        const carouselBin = {
          id: binToReturn.originalId || binToReturn.id,
          label: binToReturn.name,
          width: binToReturn.width,
          depth: binToReturn.length,
          color: binToReturn.color
        };
        setRemainingBins(prev => [...prev, carouselBin]);
      }
      
      // Clear selection if this bin was selected
      if (selectedBinId === placedBinId) {
        setSelectedBin(null);
        setSelectedBinId(null);
      }
      
      showCenterError('Bin returned to carousel');
    }
  };

  // Bin management functions
  const handleBinClick = (bin) => {
    setSelectedBinId(bin.id);
    setSelectedBin(bin);
  };

  const handleBinSave = (updatedBin) => {
    setPlacedBins(prev => prev.map(bin => 
      bin.id === updatedBin.id ? updatedBin : bin
    ));
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleBinDelete = (binId) => {
    handleBinRemove(binId);
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handlePanelClose = () => {
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleBinDrop = (item, x, y) => {
    if (item.fromGrid && item.placedBinId) {
      // Moving existing bin from grid to grid
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      
      const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
      if (!binToMove) return;
      
      const newPosition = {
        ...binToMove,
        x: gridX * GRID_SIZE,
        y: gridY * GRID_SIZE
      };
      
      // Check if new position is valid (excluding the bin being moved)
      if (canPlaceBin(newPosition, item.placedBinId)) {
        setPlacedBins(prev => prev.map(bin => 
          bin.id === item.placedBinId ? newPosition : bin
        ));
      } else {
        showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
      }
    } else if (item.placedBinId) {
      // Moving existing bin (legacy support)
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      
      const binToMove = placedBins.find(bin => bin.id === item.placedBinId);
      if (!binToMove) return;
      
      const newPosition = {
        ...binToMove,
        x: gridX * GRID_SIZE,
        y: gridY * GRID_SIZE
      };
      
      if (canPlaceBin(newPosition, item.placedBinId)) {
        setPlacedBins(prev => prev.map(bin => 
          bin.id === item.placedBinId ? newPosition : bin
        ));
      } else {
        showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
      }
    } else {
      // Placing new bin from carousel
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      
      const newBin = {
        id: Date.now(),
        originalId: item.bin.id, // Track original bin ID
        ...item.bin,
        x: gridX * GRID_SIZE,
        y: gridY * GRID_SIZE,
        width: item.bin.width,
        length: item.bin.depth,
        height: 21,
        shadowBoard: false,
        name: item.bin.label
      };

      if (canPlaceBin(newBin)) {
        setPlacedBins(prev => [...prev, newBin]);
        setRemainingBins(prev => prev.filter(bin => bin.id !== item.bin.id));
      } else {
        showCenterError('Cannot place bin here - overlaps with existing bin or outside bounds');
      }
    }
  };

  const handleBinRemove = (binId) => {
    const binToRemove = placedBins.find(bin => bin.id === binId);
    if (binToRemove) {
      setPlacedBins(prev => prev.filter(bin => bin.id !== binId));
      
      // Only add back to available bins if it was originally from availableBins
      // (not custom drawn bins)
      const originalBin = availableBins.find(bin => bin.id === binToRemove.originalId || bin.id === binToRemove.id);
      if (originalBin) {
        setRemainingBins(prev => [...prev, originalBin]);
      }
    }
  };

  const canPlaceBin = (newBin, excludeBinId = null) => {
    const newBinRight = newBin.x + newBin.width;
    const newBinBottom = newBin.y + newBin.length;
    
    // Check bounds
    if (newBinRight > drawerDimensions.width || newBinBottom > drawerDimensions.depth) {
      return false;
    }

    // Check for overlaps with other bins (excluding the bin being moved)
    return !placedBins.some(existingBin => {
      if (existingBin.id === newBin.id || existingBin.id === excludeBinId) return false;
      
      const existingRight = existingBin.x + existingBin.width;
      const existingBottom = existingBin.y + existingBin.length;
      
      return !(newBin.x >= existingRight || 
               newBinRight <= existingBin.x || 
               newBin.y >= existingBottom || 
               newBinBottom <= existingBin.y);
    });
  };

  // Drawing functions
  const handleMouseDown = (e) => {
    // Don't start drawing if we're dragging a bin or clicking on a placed bin
    if (e.target.closest('[draggable="true"]') || e.target.closest('.placed-bin')) {
      return;
    }
    
    // Check if clicking on a bin - if so, don't start drawing
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const clickedBin = placedBins.find(bin => {
      const binLeft = (bin.x / GRID_SIZE) * cellSize;
      const binTop = (bin.y / GRID_SIZE) * cellSize;
      const binRight = binLeft + (bin.width / GRID_SIZE) * cellSize;
      const binBottom = binTop + (bin.length / GRID_SIZE) * cellSize;
      
      return clickX >= binLeft && clickX <= binRight && clickY >= binTop && clickY <= binBottom;
    });
    
    if (clickedBin) {
      // Let the bin handle the click
      handleBinClick(clickedBin);
      return;
    }
    
    // Start drawing a new bin
    const x = Math.floor(clickX / cellSize);
    const y = Math.floor(clickY / cellSize);
    
    setDrawing(true);
    setStartPoint({ x, y });
    setEndPoint({ x, y });
    setDrawingError(null); // Clear any previous errors
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    setEndPoint({ x, y });
    
    // Real-time validation for visual feedback
    const width = (Math.abs(x - startPoint.x) + 1) * GRID_SIZE;
    const length = (Math.abs(y - startPoint.y) + 1) * GRID_SIZE;
    const binX = Math.min(startPoint.x, x) * GRID_SIZE;
    const binY = Math.min(startPoint.y, y) * GRID_SIZE;
    
    // Check validation rules
    let hasError = false;
    if (width < 21 || length < 21 || (width < 42 && length < 42)) {
      hasError = true;
    } else if (width > 250 || length > 250) {
      hasError = true;
    } else if (width % 21 !== 0 || length % 21 !== 0) {
      hasError = true;
    } else {
      // Check for overlaps
      const testBin = { x: binX, y: binY, width, length };
      hasError = !canPlaceBin(testBin);
    }
    
    setDrawingError(hasError ? 'invalid' : null);
  };

  const handleMouseUp = () => {
    if (drawing && startPoint && endPoint) {
      // Only proceed if not currently showing invalid state
      if (drawingError === 'invalid') {
        setDrawing(false);
        setStartPoint(null);
        setEndPoint(null);
        setDrawingError(null);
        return;
      }

      const width = (Math.abs(endPoint.x - startPoint.x) + 1) * GRID_SIZE;
      const length = (Math.abs(endPoint.y - startPoint.y) + 1) * GRID_SIZE;
      const x = Math.min(startPoint.x, endPoint.x) * GRID_SIZE;
      const y = Math.min(startPoint.y, endPoint.y) * GRID_SIZE;
      
      // Validate bin size constraints
      let errorMessage = null;
      if (width < 21 || length < 21 || (width < 42 && length < 42)) {
        errorMessage = 'Bins must be at least 21mm on each side with at least one side being 42mm (minimum 1×2 cells)';
      } else if (width > 250 || length > 250) {
        errorMessage = 'Bins cannot exceed 250mm on any side';
      } else if (width % 21 !== 0 || length % 21 !== 0) {
        errorMessage = 'Bin dimensions must be multiples of 21mm (cell size)';
      }
      
      if (errorMessage) {
        setDrawingError(errorMessage);
        setTimeout(() => setDrawingError(null), 3000);
      } else {
        const newBin = {
          id: Date.now(),
          x,
          y,
          width,
          length,
          height: 21,
          shadowBoard: false,
          name: `Custom ${width}×${length}`,
          color: '#3b82f6'
        };

        if (canPlaceBin(newBin)) {
          setPlacedBins(prev => [...prev, newBin]);
          setDrawingError(null);
        } else {
          setDrawingError('Cannot place bin here - overlaps with existing bin');
          setTimeout(() => setDrawingError(null), 3000);
        }
      }
    }
    
    setDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
  };

  // Utility functions
  const handleReset = () => {
    setPlacedBins([]);
    setRemainingBins([...availableBins]); // Reset to original available bins
    setSelectedBin(null);
    setSelectedBinId(null);
  };

  const handleAutoSort = () => {
    if (placedBins.length === 0) {
      showCenterError('No bins to sort');
      return;
    }

    // Helper function to check if a bin can be placed at a position
    const canPlaceBinAt = (bin, x, y, placedPositions) => {
      const binRight = x + bin.width;
      const binBottom = y + bin.length;
      
      // Check bounds
      if (binRight > drawerDimensions.width || binBottom > drawerDimensions.depth) {
        return false;
      }
      
      // Check for overlaps with already placed bins
      return !placedPositions.some(placed => {
        const placedRight = placed.x + placed.width;
        const placedBottom = placed.y + placed.length;
        
        return !(x >= placedRight || 
                 binRight <= placed.x || 
                 y >= placedBottom || 
                 binBottom <= placed.y);
      });
    };

    // Helper function to check if any bins overlap in a layout
    const hasOverlaps = (layout) => {
      for (let i = 0; i < layout.length; i++) {
        for (let j = i + 1; j < layout.length; j++) {
          const bin1 = layout[i];
          const bin2 = layout[j];
          
          const bin1Right = bin1.x + bin1.width;
          const bin1Bottom = bin1.y + bin1.length;
          const bin2Right = bin2.x + bin2.width;
          const bin2Bottom = bin2.y + bin2.length;
          
          // Check if bins overlap
          if (!(bin1.x >= bin2Right || 
                bin1Right <= bin2.x || 
                bin1.y >= bin2Bottom || 
                bin1Bottom <= bin2.y)) {
            return true; // Overlap detected
          }
        }
      }
      return false; // No overlaps
    };

    // Check if drawer is already optimally packed
    const isDrawerFull = () => {
      // Calculate total area used by bins
      const totalBinArea = placedBins.reduce((sum, bin) => sum + (bin.width * bin.length), 0);
      const drawerArea = drawerDimensions.width * drawerDimensions.depth;
      
      // If bins use more than 95% of space, consider it full
      if (totalBinArea / drawerArea > 0.95) {
        return true;
      }
      
      // Check if all bins are already tightly packed (no moveable bins)
      let canImprove = false;
      for (const bin of placedBins) {
        // Try to move each bin to top-left position to see if improvement is possible
        if (bin.x > 0 || bin.y > 0) {
          // Check if this bin could be moved closer to origin
          for (let testY = 0; testY <= bin.y; testY += GRID_SIZE) {
            for (let testX = 0; testX <= bin.x; testX += GRID_SIZE) {
              if (testX < bin.x || testY < bin.y) {
                const otherBins = placedBins.filter(b => b.id !== bin.id);
                if (canPlaceBinAt(bin, testX, testY, otherBins)) {
                  canImprove = true;
                  break;
                }
              }
            }
            if (canImprove) break;
          }
          if (canImprove) break;
        }
      }
      
      return !canImprove;
    };

    // Check if drawer is already optimally sorted
    if (isDrawerFull()) {
      showCenterError('Your drawer is already sorted');
      return;
    }

    // Helper function to get bin rotated 90 degrees
    const getRotatedBin = (bin) => ({
      ...bin,
      width: bin.length,
      length: bin.width
    });

    // Helper function to find the best position for a bin
    const findBestPosition = (bin, placedPositions) => {
      const positions = [];
      
      // Try both orientations (original and rotated)
      const orientations = [bin];
      if (bin.width !== bin.length) { // Only add rotation if bin is not square
        orientations.push(getRotatedBin(bin));
      }
      
      for (const orientation of orientations) {
        // Try placing at every grid position
        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            const x = col * GRID_SIZE;
            const y = row * GRID_SIZE;
            
            if (canPlaceBinAt(orientation, x, y, placedPositions)) {
              // Calculate fitness score (prefer top-left positions and avoid creating 1-cell gaps)
              const score = calculatePositionScore(orientation, x, y, placedPositions);
              positions.push({
                bin: orientation,
                x,
                y,
                score,
                isRotated: orientation.width !== bin.width
              });
            }
          }
        }
      }
      
      // Sort by score (lower is better) and return the best position
      positions.sort((a, b) => a.score - b.score);
      return positions.length > 0 ? positions[0] : null;
    };

    // Helper function to calculate position score (lower is better)
    const calculatePositionScore = (bin, x, y, placedPositions) => {
      let score = 0;
      
      // Prefer top-left positions (Manhattan distance from origin)
      score += (x / GRID_SIZE) + (y / GRID_SIZE);
      
      // Check for 1-cell gaps around the bin position
      const gapPenalty = calculateGapPenalty(bin, x, y, placedPositions);
      score += gapPenalty * 1000; // Heavy penalty for creating 1-cell gaps
      
      return score;
    };

    // Helper function to detect if placing a bin would create 1-cell gaps
    const calculateGapPenalty = (bin, x, y, placedPositions) => {
      let penalty = 0;
      const binRight = x + bin.width;
      const binBottom = y + bin.length;
      
      // Create a temporary layout with the new bin
      const tempLayout = [...placedPositions, { x, y, width: bin.width, length: bin.length }];
      
      // Check cells around the bin for potential 1-cell gaps
      const checkPositions = [
        // Left side
        { x: x - GRID_SIZE, y: y, width: GRID_SIZE, length: bin.length },
        // Right side  
        { x: binRight, y: y, width: GRID_SIZE, length: bin.length },
        // Top side
        { x: x, y: y - GRID_SIZE, width: bin.width, length: GRID_SIZE },
        // Bottom side
        { x: x, y: binBottom, width: bin.width, length: GRID_SIZE }
      ];
      
      checkPositions.forEach(pos => {
        // Check if this position is within bounds
        if (pos.x >= 0 && pos.y >= 0 && 
            pos.x + pos.width <= drawerDimensions.width && 
            pos.y + pos.length <= drawerDimensions.depth) {
          
          // Check if this position is empty (would create a gap)
          const isEmpty = !tempLayout.some(placed => {
            const placedRight = placed.x + placed.width;
            const placedBottom = placed.y + placed.length;
            
            return !(pos.x >= placedRight || 
                     pos.x + pos.width <= placed.x || 
                     pos.y >= placedBottom || 
                     pos.y + pos.length <= placed.y);
          });
          
          if (isEmpty && pos.width === GRID_SIZE && pos.length === GRID_SIZE) {
            penalty += 1; // Penalty for creating a 1-cell gap
          }
        }
      });
      
      return penalty;
    };

    // Sort bins by area (largest first) for better packing
    const sortedBins = [...placedBins].sort((a, b) => {
      const areaA = a.width * a.length;
      const areaB = b.width * b.length;
      return areaB - areaA;
    });

    const newPositions = [];
    let failedPlacements = 0;

    // Try to place each bin
    sortedBins.forEach(bin => {
      const bestPosition = findBestPosition(bin, newPositions);
      
      if (bestPosition) {
        // Place the bin in its best position
        const placedBin = {
          ...bestPosition.bin,
          id: bin.id, // Preserve original ID
          name: bin.name, // Preserve original name
          color: bin.color, // Preserve original color
          height: bin.height, // Preserve original height
          shadowBoard: bin.shadowBoard, // Preserve shadowBoard setting
          originalId: bin.originalId // Preserve original ID reference
        };
        
        newPositions.push({
          ...placedBin,
          x: bestPosition.x,
          y: bestPosition.y
        });
        
        if (bestPosition.isRotated) {
          showCenterError(`Rotated ${bin.name || 'bin'} for better fit`);
        }
      } else {
        // Count failed placements
        failedPlacements++;
      }
    });

    // If we couldn't place all bins without overlaps, sorting failed
    if (failedPlacements > 0) {
      showCenterError('Your drawer is already maximally sorted for your current set of bins');
      return;
    }

    // Final validation: check for any overlaps in the final layout
    if (hasOverlaps(newPositions)) {
      showCenterError('Sorting would cause overlaps - your drawer is already maximally sorted');
      return;
    }

    // Additional check: ensure we didn't lose any bins
    if (newPositions.length !== placedBins.length) {
      showCenterError('Cannot sort without losing bins - your drawer is already maximally sorted');
      return;
    }

    // If we get here, sorting was successful
    setPlacedBins(newPositions);
    showCenterError('Bins auto-sorted successfully!');
  };

  const handleAutoFill = () => {
    // Generate bins to fill empty spaces with preference for larger bins
    const newBins = [];
    let binCounter = placedBins.length;

    // Standard bin sizes (in mm) - ordered by area (largest first) for preference
    const standardSizes = [
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

    // Helper function to check if area is completely free
    const isAreaFree = (x, y, width, length, existingBins) => {
      const binRight = x + width;
      const binBottom = y + length;
      
      // Check bounds
      if (binRight > drawerDimensions.width || binBottom > drawerDimensions.depth) {
        return false;
      }
      
      // Check against existing bins (both placed and new)
      return !existingBins.some(bin => {
        const existingRight = bin.x + bin.width;
        const existingBottom = bin.y + bin.length;
        
        return !(x >= existingRight || 
                 binRight <= bin.x || 
                 y >= existingBottom || 
                 binBottom <= bin.y);
      });
    };

    // Track all bins (existing + new) to prevent overlaps
    let allBins = [...placedBins];

    // Try to fill spaces row by row, cell by cell
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const x = col * GRID_SIZE;
        const y = row * GRID_SIZE;

        // Check if this cell is already occupied
        const cellOccupied = allBins.some(bin => {
          const binRight = bin.x + bin.width;
          const binBottom = bin.y + bin.length;
          return x >= bin.x && x < binRight && y >= bin.y && y < binBottom;
        });

        if (!cellOccupied) {
          // Try to fit the largest possible standard bin at this position
          for (const size of standardSizes) {
            // Ensure size constraints (21mm min with at least one side 42mm, 250mm max, 21mm increments)
            if (size.width < 21 || size.length < 21 || (size.width < 42 && size.length < 42) || size.width > 250 || size.length > 250) {
              continue;
            }
            if (size.width % 21 !== 0 || size.length % 21 !== 0) {
              continue;
            }

            if (isAreaFree(x, y, size.width, size.length, allBins)) {
              const newBin = {
                id: Date.now() + binCounter + Math.random() * 1000,
                x,
                y,
                width: size.width,
                length: size.length,
                height: 21,
                shadowBoard: false,
                name: `Auto ${binCounter + 1}`,
                color: '#10b981'
              };

              newBins.push(newBin);
              allBins.push(newBin);
              binCounter++;
              break; // Found a bin for this position, move to next
            }
          }
        }
      }
    }

    if (newBins.length > 0) {
      setPlacedBins(prev => [...prev, ...newBins]);
      showCenterError(`Added ${newBins.length} auto-generated bins!`);
    } else {
      showCenterError('No space available for additional bins');
    }
  };

  const handleProceed = () => {
    if (placedBins.length === 0) {
      setErrorMessage('Please place at least one bin before proceeding.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const layoutData = {
      bins: placedBins,
      drawerDimensions,
      totalCost: placedBins.reduce((sum, bin) => sum + calculateBinPrice(bin), 0)
    };
    
    onLayoutComplete(layoutData);
    navigate('/review');
  };

  // Add keyboard support for deletion
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

  // Window resize handler for responsive grid
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

  // Hide drop shadow when not dragging
  useEffect(() => {
    const handleMouseUp = () => {
      setDropShadow({ visible: false, x: 0, y: 0, width: 0, height: 0, error: false });
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Double-click to delete bins
  const handleBinDoubleClick = (bin) => {
    handleBinDelete(bin.id);
  };

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
                <ActionButtonsContainer>
                  <SecondaryButton onClick={handleAutoSort}>
                    Auto-Sort Bins
                  </SecondaryButton>
                  <SecondaryButton onClick={handleAutoFill}>
                    Fill Empty Space
                  </SecondaryButton>
                  <SecondaryButton onClick={handleReset}>
                    Reset Layout
                  </SecondaryButton>
                  <PrimaryButton 
                    onClick={handleProceed} 
                    disabled={placedBins.length === 0}
                  >
                    Review Order
                  </PrimaryButton>
                </ActionButtonsContainer>

                <Grid cols={gridCols} rows={gridRows} cellSize={cellSize} data-grid="true" ref={drop}>
              {Array.from({ length: gridRows }, (_, row) =>
                Array.from({ length: gridCols }, (_, col) => (
                  <GridCell 
                    key={`${row}-${col}`} 
                    x={col} 
                    y={row} 
                    cellSize={cellSize}
                    onDrop={handleBinDrop}
                    onMoveBin={(placedBinId, x, y) => {
                      setPlacedBins(prev => prev.map(bin => 
                        bin.id === placedBinId 
                          ? { ...bin, x: x * GRID_SIZE, y: y * GRID_SIZE }
                          : bin
                      ));
                    }}
                  />
                ))
              )}

              {placedBins.map((placed) => (
                <DraggablePlacedBin
                  key={placed.id}
                  bin={placed}
                  selected={placed.id === selectedBinId}
                  cellSize={cellSize}
                  onBinClick={handleBinClick}
                  onBinDoubleClick={handleBinDoubleClick}
                />
              ))}
              
              {/* Drop shadow for dragged bins */}
              <DropShadow
                visible={dropShadow.visible}
                error={dropShadow.error}
                style={{
                  left: dropShadow.x,
                  top: dropShadow.y,
                  width: dropShadow.width,
                  height: dropShadow.height,
                }}
              />
              
              {drawing && startPoint && endPoint && (
                <DrawingPreview
                  error={drawingError === 'invalid'}
                  style={{
                    left: Math.min(startPoint.x, endPoint.x) * cellSize,
                    top: Math.min(startPoint.y, endPoint.y) * cellSize,
                    width: (Math.abs(endPoint.x - startPoint.x) + 1) * cellSize,
                    height: (Math.abs(endPoint.y - startPoint.y) + 1) * cellSize,
                  }}
                />
              )}
              
              <DrawingOverlay
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              />
            </Grid>
          </GridWrapper>

          <p style={{ 
            textAlign: 'center', 
            marginTop: '0.125rem', 
            marginBottom: 0,
            color: '#6b7280', 
            fontSize: '0.65rem',
            maxWidth: '100%',
            wordWrap: 'break-word',
            padding: '0 0.5rem',
            lineHeight: 1.1,
            height: '1rem',
            overflow: 'hidden'
          }}>
            Click bins to select • Drag to move • Delete key removes
          </p>
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
