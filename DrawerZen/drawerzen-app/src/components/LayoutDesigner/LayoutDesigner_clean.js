import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useDrop } from 'react-dnd';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import DraggableBin from './DraggableBin';
import GridCell from './GridCell';

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
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-sizing: border-box;
`;

const BinCarousel = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 1rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  flex-shrink: 0;
  max-height: 140px;
  width: 100%;
`;

const CarouselContent = styled.div`
  display: flex;
  gap: 1rem;
  min-width: min-content;
  padding-bottom: 0.5rem;
`;

const DrawerContainer = styled.div`
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow: hidden;
  min-height: 0;
`;

const GridSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
`;

const GridWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
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
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  ${props => props.selected && `
    border-color: #fbbf24;
    box-shadow: 0 0 0 2px #fbbf24;
  `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
`;

const PrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: white;
  color: #4f46e5;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4f46e5;
    color: white;
    transform: translateY(-1px);
  }
`;

const CustomizationPanel = styled.div`
  width: ${props => props.open ? '280px' : '0px'};
  height: 100%;
  background: #fff;
  box-shadow: ${props => props.open ? '-2px 0 12px rgba(0,0,0,0.08)' : 'none'};
  z-index: 50;
  display: flex;
  flex-direction: column;
  padding: ${props => props.open ? '1rem' : '0'};
  transition: all 0.3s cubic-bezier(.4,0,.2,1);
  border-left: ${props => props.open ? '1px solid #e5e7eb' : 'none'};
  align-items: center;
  overflow: hidden;
  flex-shrink: 0;
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  width: 100%;
`;

const BinNameInput = styled.input`
  font-weight: 700;
  font-size: 1.2rem;
  background: transparent;
  border: none;
  outline: none;
  color: #1f2937;
  text-align: center;
  width: 100%;
  margin-right: 1rem;
  
  &:focus {
    background: #f9fafb;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
  }
`;

const PriceDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #4f46e5;
  text-align: center;
  margin-bottom: 1rem;
`;

const HeightSlider = styled.input`
  width: 100%;
  margin: 0.5rem 0;
`;

const ShadowBoardToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  
  input {
    margin: 0;
  }
`;

const PreviewContainer = styled.div`
  width: 200px;
  height: 150px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
`;

const PanelActions = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
  margin-top: auto;
  padding-top: 1rem;
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #059669;
  }
`;

const DeleteButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #dc2626;
  }
`;

const DrawingPreview = styled.div`
  position: absolute;
  border: 2px dashed #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  pointer-events: none;
  z-index: 5;
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
  z-index: 20;
  cursor: crosshair;
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

export default function LayoutDesigner({ drawerDimensions, availableBins = [], onLayoutComplete }) {
  const [customizingBin, setCustomizingBin] = useState(null);
  const [binName, setBinName] = useState('');
  const navigate = useNavigate();
  const [placedBins, setPlacedBins] = useState([]);
  const [selectedBinId, setSelectedBinId] = useState(null);
  const [remainingBins, setRemainingBins] = useState(availableBins || []);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [drawingError, setDrawingError] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [centerErrorMessage, setCenterErrorMessage] = useState(null);

  // Calculate grid dimensions
  const cellSize = 20; // Display size in pixels
  const gridCols = Math.floor(drawerDimensions.width / GRID_SIZE);
  const gridRows = Math.floor(drawerDimensions.depth / GRID_SIZE);

  const showCenterError = (message) => {
    setCenterErrorMessage(message);
    setTimeout(() => setCenterErrorMessage(null), 3000);
  };

  const [{ isOver }, drop] = useDrop({
    accept: 'bin',
    drop: (item, monitor) => {
      const offset = monitor.getDropResult();
      if (offset) {
        handleBinDrop(item, offset.x, offset.y);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Bin management functions
  const updateBinProperty = (property, value) => {
    if (customizingBin) {
      const updatedBin = { ...customizingBin, [property]: value };
      setCustomizingBin(updatedBin);
      
      setPlacedBins(prev => prev.map(bin => 
        bin.id === customizingBin.id ? updatedBin : bin
      ));
    }
  };

  const handleBinClick = (bin) => {
    setSelectedBinId(bin.id);
    setCustomizingBin(bin);
    setBinName(bin.name || bin.label || '');
  };

  const handleBinDrop = (item, x, y) => {
    if (item.placedBinId) {
      // Moving existing bin
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      
      setPlacedBins(prev => prev.map(bin => 
        bin.id === item.placedBinId 
          ? { ...bin, x: gridX * GRID_SIZE, y: gridY * GRID_SIZE }
          : bin
      ));
    } else {
      // Placing new bin
      const gridX = Math.floor(x / cellSize);
      const gridY = Math.floor(y / cellSize);
      
      const newBin = {
        id: Date.now(),
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
        showCenterError('Cannot place bin here - overlaps with existing bin');
      }
    }
  };

  const handleBinRemove = (binId) => {
    const binToRemove = placedBins.find(bin => bin.id === binId);
    if (binToRemove) {
      setPlacedBins(prev => prev.filter(bin => bin.id !== binId));
      setRemainingBins(prev => [...prev, {
        id: binToRemove.id,
        label: binToRemove.name || binToRemove.label,
        width: binToRemove.width,
        depth: binToRemove.length,
        color: binToRemove.color || '#3b82f6'
      }]);
    }
  };

  const canPlaceBin = (newBin) => {
    const newBinRight = newBin.x + newBin.width;
    const newBinBottom = newBin.y + newBin.length;
    
    if (newBinRight > drawerDimensions.width || newBinBottom > drawerDimensions.depth) {
      return false;
    }

    return !placedBins.some(existingBin => {
      if (existingBin.id === newBin.id) return false;
      
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    setDrawing(true);
    setStartPoint({ x, y });
    setEndPoint({ x, y });
    setDrawingError(null);
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPoint) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);
    
    setEndPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (drawing && startPoint && endPoint) {
      const width = (Math.abs(endPoint.x - startPoint.x) + 1) * GRID_SIZE;
      const length = (Math.abs(endPoint.y - startPoint.y) + 1) * GRID_SIZE;
      const x = Math.min(startPoint.x, endPoint.x) * GRID_SIZE;
      const y = Math.min(startPoint.y, endPoint.y) * GRID_SIZE;
      
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
      } else {
        setDrawingError('Cannot place bin here - overlaps with existing bin');
      }
    }
    
    setDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
  };

  // Utility functions
  const handleReset = () => {
    setPlacedBins([]);
    setRemainingBins(availableBins);
    setCustomizingBin(null);
    setSelectedBinId(null);
  };

  const handleAutoSort = () => {
    showCenterError('Auto-sort feature coming soon!');
  };

  const handleAutoFill = () => {
    showCenterError('Auto-fill feature coming soon!');
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

  useEffect(() => {
    if (customizingBin) {
      setBinName(customizingBin.name || customizingBin.label || '');
    }
  }, [customizingBin]);

  return (
    <DesignerContainer>
      <BinCarousel>
        <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Available Bins</h3>
        <CarouselContent>
          {remainingBins.map((bin) => (
            <DraggableBin key={bin.id} bin={bin} />
          ))}
          {remainingBins.length === 0 && (
            <p style={{ color: '#6b7280', margin: 0 }}>All bins have been placed</p>
          )}
        </CarouselContent>
      </BinCarousel>

      <DrawerContainer ref={drop}>
        <GridSection>
          <GridWrapper>
            <Grid cols={gridCols} rows={gridRows} cellSize={cellSize}>
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
                <PlacedBin
                  key={placed.id}
                  color={placed.color}
                  selected={placed.id === selectedBinId}
                  style={{
                    left: (placed.x / GRID_SIZE) * cellSize,
                    top: (placed.y / GRID_SIZE) * cellSize,
                    width: (placed.width / GRID_SIZE) * cellSize,
                    height: (placed.length / GRID_SIZE) * cellSize,
                  }}
                  onClick={() => handleBinClick(placed)}
                >
                  <DraggableBin
                    bin={{
                      id: placed.id,
                      label: placed.name || `${placed.width}×${placed.length}`,
                      width: placed.width,
                      depth: placed.length,
                      color: placed.color
                    }}
                    mode="grid"
                    placedBinId={placed.id}
                  />
                </PlacedBin>
              ))}
              
              {drawing && startPoint && endPoint && (
                <DrawingPreview
                  error={!!drawingError}
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
                onClick={() => setSelectedBinId(null)}
              />
            </Grid>
          </GridWrapper>

          <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
            Click and drag to draw bins • Click to select • Double-click or Delete key to remove • 42mm grid display, 21mm precision
          </p>

          <ActionButtons>
            <SecondaryButton onClick={handleReset}>
              Reset Layout
            </SecondaryButton>
            <SecondaryButton onClick={handleAutoSort}>
              Auto-Sort Bins
            </SecondaryButton>
            <SecondaryButton onClick={handleAutoFill}>
              Fill Empty Space
            </SecondaryButton>
            <PrimaryButton 
              onClick={handleProceed} 
              disabled={placedBins.length === 0}
            >
              Review Order
            </PrimaryButton>
          </ActionButtons>
        </GridSection>

        <CustomizationPanel open={!!customizingBin}>
          {customizingBin && (
            <>
              <PanelHeader>
                <BinNameInput
                  value={binName}
                  onChange={(e) => setBinName(e.target.value)}
                  placeholder="Enter bin name..."
                />
                {(customizingBin.height !== 21 || customizingBin.shadowBoard) && (
                  <PriceDisplay>
                    +${calculateBinPrice(customizingBin).toFixed(2)}
                  </PriceDisplay>
                )}
              </PanelHeader>
              
              <div style={{ 
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: '#374151' }}>
                  Bin Size: {customizingBin.width}mm × {customizingBin.length}mm
                </h3>
              </div>
              
              <div style={{ 
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '0.875rem', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '8px' 
                }}>
                  Height: {customizingBin.height}mm
                </label>
                <HeightSlider
                  type="range"
                  min="21"
                  max="42"
                  step="7"
                  value={customizingBin.height}
                  onChange={(e) => updateBinProperty('height', parseInt(e.target.value))}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '4px'
                }}>
                  <span>21mm (Standard)</span>
                  <span>28mm</span>
                  <span>35mm</span>
                  <span>42mm (Max)</span>
                </div>
              </div>
              
              <div style={{ 
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <ShadowBoardToggle>
                  <input
                    type="checkbox"
                    checked={customizingBin.shadowBoard}
                    onChange={(e) => updateBinProperty('shadowBoard', e.target.checked)}
                  />
                  <span>Add Shadow Board (+$3.00)</span>
                </ShadowBoardToggle>
              </div>
              
              <div style={{ 
                padding: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  3D Preview
                </h4>
                <PreviewContainer>
                  <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    
                    <Box args={[
                      customizingBin.width / 100,
                      customizingBin.height / 100,
                      customizingBin.length / 100
                    ]}>
                      <meshStandardMaterial color="#f3f4f6" />
                    </Box>
                    
                    {customizingBin.shadowBoard && (
                      <Box 
                        position={[0, -(customizingBin.height / 200) - 0.015, 0]}
                        args={[
                          customizingBin.width / 100,
                          0.03,
                          customizingBin.length / 100
                        ]}
                      >
                        <meshStandardMaterial color="#1f2937" />
                      </Box>
                    )}
                    
                    <group>
                      <Box 
                        position={[0, 0, (customizingBin.length / 200)]}
                        args={[customizingBin.width / 100, customizingBin.height / 100, 0.02]}
                      >
                        <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                      </Box>
                      
                      <Box 
                        position={[0, 0, -(customizingBin.length / 200)]}
                        args={[customizingBin.width / 100, customizingBin.height / 100, 0.02]}
                      >
                        <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                      </Box>
                      
                      <Box 
                        position={[-(customizingBin.width / 200), 0, 0]}
                        args={[0.02, customizingBin.height / 100, customizingBin.length / 100]}
                      >
                        <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                      </Box>
                      
                      <Box 
                        position={[(customizingBin.width / 200), 0, 0]}
                        args={[0.02, customizingBin.height / 100, customizingBin.length / 100]}
                      >
                        <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                      </Box>
                    </group>
                    
                    <OrbitControls enableZoom={true} enablePan={false} />
                  </Canvas>
                </PreviewContainer>
              </div>
              
              <PanelActions>
                <ConfirmButton onClick={() => {
                  setPlacedBins(prev => prev.map(bin => 
                    bin.id === customizingBin.id 
                      ? { ...bin, name: binName }
                      : bin
                  ));
                  setCustomizingBin(null);
                  setSelectedBinId(null);
                }}>
                  Confirm
                </ConfirmButton>
                <DeleteButton onClick={() => {
                  handleBinRemove(customizingBin.id);
                  setCustomizingBin(null);
                  setSelectedBinId(null);
                }}>
                  Delete
                </DeleteButton>
              </PanelActions>
            </>
          )}
        </CustomizationPanel>
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
