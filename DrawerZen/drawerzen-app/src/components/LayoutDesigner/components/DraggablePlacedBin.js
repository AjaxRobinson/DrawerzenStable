import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { PlacedBin } from '../LayoutDesigner.styles';

const colorwayMap = {
  cream: '#F5E6C8',
  blue: '#1A237E',
  black: '#222222'
};

const bedColorMap = {
  cream: '#4A4A58',
  blue: '#90CAF9',
  black: '#B2FF59'
};

const DraggablePlacedBin = ({
  bin,
  cellSize,
  selected,
  isDragging,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onFocusBin,
  onBlurBin
}) => {
  const [{ isDragging: dragState }, drag] = useDrag({
    type: 'placed-bin',
    item: () => {
      onDragStart();
      return { 
        bin, 
        placedBinId: bin.id,
        fromGrid: true 
      };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: () => onDragEnd()
  });

  const style = useMemo(() => ({
    left: (bin.x / 21) * cellSize,
    top: (bin.y / 21) * cellSize,
    width: (bin.width / 21) * cellSize,
    height: ((bin.length || bin.height) / 21) * cellSize
  }), [bin.x, bin.y, bin.width, bin.length, bin.height, cellSize]);

  const bedStyle = useMemo(() => ({
    position: 'absolute',
    top: '2mm',
    left: '2mm',
    right: '2mm',
    bottom: '2mm',
    background: bedColorMap[bin.colorway] || '#4A4A58',
    borderRadius: '3px',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)',
    pointerEvents: 'none'
  }), [bin.colorway]);

  return (
    <PlacedBin
      ref={drag}
      style={style}
      $color={colorwayMap[bin.colorway] || bin.color || '#F5E6C8'}
      $selected={selected}
      $isDragging={isDragging || dragState}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      tabIndex={0}
      onFocus={() => onFocusBin && onFocusBin(bin)}
      onBlur={() => onBlurBin && onBlurBin(bin)}
    >
      {/* Internal bed with 2mm wall gap */}
      <div style={bedStyle} />
      {bin.label}
    </PlacedBin>
  );
};

export default React.memo(DraggablePlacedBin);
