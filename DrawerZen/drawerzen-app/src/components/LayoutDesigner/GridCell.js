import React from 'react';
import { useDrop } from 'react-dnd';

export default function GridCell({ x, y, onDrop, onMoveBin }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'bin',
    drop: (item) => {
      if (item.placedBinId && item.mode === 'grid') {
        // Moving an existing placed bin
        onMoveBin(item.placedBinId, x, y);
      } else {
        // Placing a new bin from carousel
        onDrop(item.bin, x, y);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const getBackgroundColor = () => {
    if (isOver && canDrop) {
      return 'rgba(79, 70, 229, 0.2)'; // Highlight color on hover
    }
    return '#f9fafb'; // Default grid cell color
  };

  return (
    <div
      ref={drop}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: getBackgroundColor(),
        transition: 'background-color 0.2s',
      }}
    />
  );
}