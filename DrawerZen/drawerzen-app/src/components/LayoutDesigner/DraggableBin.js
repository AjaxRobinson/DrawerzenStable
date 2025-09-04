import React from 'react';
import { useDrag } from 'react-dnd';
import styled, { css } from 'styled-components';
import { FaBoxOpen, FaUtensils, FaPlug } from 'react-icons/fa'; // Example icons
import { GRID_SIZE } from './LayoutDesigner.constants';

const BinItem = styled.div`
  background: ${props => props.color};
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s ease-in-out;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;

  ${props => props.isDragging && css`
    opacity: 0.5;
    transform: scale(1.05);
  `}

  ${props => props.mode === 'carousel' && css`
    min-width: 60px;
    width: 60px;
    height: 60px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
  `}
`;

const BinIcon = styled.div`
  font-size: ${props => props.mode === 'carousel' ? '1.2rem' : '2.5rem'};
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-bottom: ${props => props.mode === 'carousel' ? '2px' : '0'};
`;

const BinDimensions = styled.div`
  font-family: 'Space Mono', monospace;
  font-size: ${props => props.mode === 'carousel' ? '0.6rem' : '0.7rem'};
  background: rgba(0,0,0,0.2);
  padding: ${props => props.mode === 'carousel' ? '1px 3px' : '2px 6px'};
  border-radius: 4px;
  position: ${props => props.mode === 'carousel' ? 'static' : 'absolute'};
  bottom: ${props => props.mode === 'carousel' ? 'auto' : '8px'};
  right: ${props => props.mode === 'carousel' ? 'auto' : '8px'};
  text-align: center;
  font-weight: 600;
`;

// A simple function to pick an icon based on the bin label
const getIconForBin = (label) => {
  if (label.toLowerCase().includes('utensil')) return <FaUtensils />;
  if (label.toLowerCase().includes('cable')) return <FaPlug />;
  return <FaBoxOpen />;
};

export default function DraggableBin({ bin, mode = 'grid', placedBinId }) {
  const [{ isDragging }, drag] = useDrag({
    type: 'bin',
    item: { bin, placedBinId, mode },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  // Convert mm to cells for carousel display
  const widthCells = Math.round(bin.width / GRID_SIZE);
  const lengthCells = Math.round(bin.length / GRID_SIZE);
  
  // Choose display format based on mode
  const dimensionText = mode === 'carousel' 
    ? `${widthCells}×${lengthCells}`  // Show cells in carousel
    : `${bin.width}×${bin.length}`;  // Show mm in grid

  return (
    <BinItem
      ref={drag}
      isDragging={isDragging}
      color={bin.color || '#B6B5B3'}
      mode={mode}
    >
      <BinIcon mode={mode}>
        {getIconForBin(bin.label)}
      </BinIcon>
      <BinDimensions mode={mode}>
        {dimensionText}
      </BinDimensions>
    </BinItem>
  );
}