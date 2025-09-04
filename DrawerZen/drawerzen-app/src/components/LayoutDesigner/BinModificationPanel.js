import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { calculateBinPrice } from './LayoutDesigner.utils';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box } from '@react-three/drei';
import { colors } from './LayoutDesigner.constants';

// Map standardized colors to user-friendly names
const BIN_COLORS = [
  { name: 'Blue', value: colors[0] },    // '#3b82f6'
  { name: 'Red', value: colors[1] },     // '#ef4444'
  { name: 'Green', value: colors[2] },   // '#10b981'
  { name: 'Yellow', value: colors[3] },  // '#f59e0b'
  { name: 'Purple', value: colors[4] },  // '#8b5cf6'
  { name: 'Pink', value: colors[5] }     // '#ec4899'
];

const COLORWAY_OPTIONS = [
  { id: 'cream', name: 'Cream / Slate', bin: '#F5E6C8', bed: '#4A4A58' },
  { id: 'blue', name: 'Dark Blue / Sky', bin: '#1A237E', bed: '#90CAF9' },
  { id: 'black', name: 'Black / Lime', bin: '#222222', bed: '#B2FF59' }
];

// Styled Components
const PanelContainer = styled.div`
  width: 100%;
  height: ${props => props.$open ? '100%' : '0px'};
  background: #fff;
  box-shadow: ${props => props.$open ? '0 2px 12px rgba(0,0,0,0.08)' : 'none'};
  display: flex;
  flex-direction: column;
  transition: height 0.4s cubic-bezier(.4,0,.2,1), opacity 0.3s ease;
  border: ${props => props.$open ? '1px solid #e5e7eb' : 'none'};
  overflow: hidden;
  border-radius: 12px;
  opacity: ${props => props.$open ? 1 : 0};
`;

const PanelHeader = styled.div`
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
  opacity: ${props => props.$open ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const BinNameInput = styled.input`
  font-weight: 700;
  font-size: 1.25rem;
  background: transparent;
  border: 2px solid transparent;
  outline: none;
  color: #1f2937;
  width: 100%;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:focus {
    background: #fff;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  &:hover {
    background: #fff;
  }
`;

const PriceDisplay = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: #4f46e5;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #eef2ff;
  border-radius: 6px;
  text-align: center;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  opacity: ${props => props.$open ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const Section = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SectionTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
`;

const BinPreview = styled.div`
  width: 100%;
  height: 200px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: #f9fafb;
`;

const ColorOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
`;

const ColorOption = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0.75rem;
  border-radius: 8px;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const ColorCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 3px solid ${props => props.selected ? '#4f46e5' : '#e5e7eb'};
  box-shadow: ${props => props.selected ? '0 0 0 2px rgba(79, 70, 229, 0.2)' : 'none'};
  transition: all 0.2s;
  margin-bottom: 0.5rem;
`;

const ColorLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
`;

const ShadowOption = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ShadowToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid ${props => props.$checked ? '#4f46e5' : '#e5e7eb'};
  background: ${props => props.$checked ? '#eef2ff' : '#fff'};
  transition: all 0.2s;
  
  &:hover {
    border-color: #4f46e5;
  }
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  accent-color: #4f46e5;
`;

const ShadowLabel = styled.span`
  font-weight: 500;
  color: #374151;
  flex: 1;
`;

const ShadowDescription = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
`;

const HeightSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const HeightSlider = styled.input`
  width: 100%;
  margin: 0.5rem 0;
  accent-color: #4f46e5;
`;

const HeightLabels = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const HeightValue = styled.div`
  background: #f3f4f6;
  padding: 0.5rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  color: #374151;
`;

const PanelActions = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  gap: 1rem;
  opacity: ${props => props.$open ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const DeleteButton = styled.button`
  flex: 1;
  padding: 0.875rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const BinDimensions = styled.div`
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 500;
  color: #374151;
  margin-bottom: 1rem;
`;

export default function BinModificationPanel({ 
  open, 
  bin, 
  onClose, 
  onSave, 
  onDelete,
  gridHeight = 400
}) {
  const [binName, setBinName] = useState('');
  const [selectedColor, setSelectedColor] = useState(BIN_COLORS[0].value);
  const [shadowBoard, setShadowBoard] = useState(false);
  const [height, setHeight] = useState(21);
  const [colorway, setColorway] = useState('cream');

  // Update local state when bin changes
  useEffect(() => {
    if (bin) {
      setBinName(bin.name || '');
      setSelectedColor(bin.color || BIN_COLORS[0].value);
      setShadowBoard(bin.shadowBoard || false);
      setHeight(bin.height || 21);
      setColorway(bin.colorway || 'cream');
    }
  }, [bin]);

  const handleSave = () => {
    if (bin && onSave) {
      onSave({
        ...bin,
        name: binName,
        color: selectedColor,
        shadowBoard: shadowBoard,
        height: height,
        colorway
      });
    }
  };

  const handleDelete = () => {
    if (bin && onDelete) {
      onDelete(bin.id);
    }
  };

  if (!bin) return null;

  const price = calculateBinPrice({ ...bin, shadowBoard, height });

  return (
    <PanelContainer open={open} gridHeight={gridHeight} style={{ flex: open ? '1 1 auto' : '0 0 auto', marginTop: '0.25rem' }}>
  <PanelHeader $open={open}>
        <BinNameInput
          value={binName}
          onChange={(e) => setBinName(e.target.value)}
          placeholder="Enter bin name..."
        />
        <PriceDisplay>
          ${price.toFixed(2)}
        </PriceDisplay>
      </PanelHeader>

      <PanelContent open={open}>
        <Section>
          <BinDimensions>
            {bin.width}mm × {bin.length}mm × {height}mm
          </BinDimensions>
          
          <SectionTitle>3D Preview</SectionTitle>
          <BinPreview>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} intensity={0.8} />
              
              {/* Main bin */}
              <Box args={[
                bin.width / 100,
                height / 100,
                bin.length / 100
              ]}>
                <meshStandardMaterial color={selectedColor} />
              </Box>
              
              {/* Shadow board */}
              {shadowBoard && (
                <Box 
                  position={[0, -(height / 200) - 0.015, 0]}
                  args={[
                    bin.width / 100,
                    0.03,
                    bin.length / 100
                  ]}
                >
                  <meshStandardMaterial color="#1f2937" />
                </Box>
              )}
              
              {/* Bin walls */}
              <group>
                <Box 
                  position={[0, 0, (bin.length / 200)]}
                  args={[bin.width / 100, height / 100, 0.02]}
                >
                  <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                </Box>
                
                <Box 
                  position={[0, 0, -(bin.length / 200)]}
                  args={[bin.width / 100, height / 100, 0.02]}
                >
                  <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                </Box>
                
                <Box 
                  position={[-(bin.width / 200), 0, 0]}
                  args={[0.02, height / 100, bin.length / 100]}
                >
                  <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                </Box>
                
                <Box 
                  position={[(bin.width / 200), 0, 0]}
                  args={[0.02, height / 100, bin.length / 100]}
                >
                  <meshStandardMaterial color="#6b7280" opacity={0.3} transparent />
                </Box>
              </group>
              
              <OrbitControls enableZoom={true} enablePan={false} />
            </Canvas>
          </BinPreview>
        </Section>

        <Section>
          <SectionTitle>Bin Height</SectionTitle>
          <HeightSection>
            <HeightValue>Height: {height}mm</HeightValue>
            <HeightSlider
              type="range"
              min="21"
              max="42"
              step="7"
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value))}
            />
            <HeightLabels>
              <span>21mm (Standard)</span>
              <span>28mm</span>
              <span>35mm</span>
              <span>42mm (Max)</span>
            </HeightLabels>
          </HeightSection>
        </Section>

        <Section>
          <SectionTitle>Bin Color</SectionTitle>
          <ColorOptions>
            {BIN_COLORS.map((color) => (
              <ColorOption
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
              >
                <ColorCircle 
                  color={color.value}
                  selected={selectedColor === color.value}
                />
                <ColorLabel>{color.name}</ColorLabel>
              </ColorOption>
            ))}
          </ColorOptions>
        </Section>

        <Section>
          <SectionTitle>Shadow Board</SectionTitle>
          <ShadowToggle checked={shadowBoard}>
            <Checkbox
              type="checkbox"
              checked={shadowBoard}
              onChange={(e) => setShadowBoard(e.target.checked)}
            />
            <div>
              <ShadowLabel>Add Shadow Board Foam</ShadowLabel>
              <ShadowDescription>
                Adds a custom-cut foam layer beneath your bin for tool organization (+$3.00)
              </ShadowDescription>
            </div>
          </ShadowToggle>
        </Section>

        <Section>
          <SectionTitle>Colorway</SectionTitle>
          <ColorOptions>
            {COLORWAY_OPTIONS.map(cw => (
              <ColorOption key={cw.id} onClick={() => setColorway(cw.id)}>
                <ColorCircle color={cw.bin} selected={colorway === cw.id} />
                <ColorLabel>{cw.name}</ColorLabel>
              </ColorOption>
            ))}
          </ColorOptions>
        </Section>
      </PanelContent>

      <PanelActions open={open}>
        <ConfirmButton onClick={handleSave}>
          Save Changes
        </ConfirmButton>
        <DeleteButton onClick={handleDelete}>
          Delete Bin
        </DeleteButton>
      </PanelActions>
    </PanelContainer>
  );
}
