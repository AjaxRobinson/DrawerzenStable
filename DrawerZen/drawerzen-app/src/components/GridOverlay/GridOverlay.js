import React from 'react';
import styled from 'styled-components';

const OverlayContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
`;

const GridLine = styled.div`
  position: absolute;
  background: rgba(79, 70, 229, 0.4);
  
  &.vertical {
    top: 0;
    bottom: 0;
    width: 1px;
  }
  
  &.horizontal {
    left: 0;
    right: 0;
    height: 1px;
  }
`;

/**
 * Proportionally accurate grid overlay component
 */
function GridOverlay({ cols, rows }) {
  // Create arrays for vertical and horizontal lines
  const colLines = Array.from({ length: cols + 1 }, (_, i) => i);
  const rowLines = Array.from({ length: rows + 1 }, (_, i) => i);

  return (
    <OverlayContainer>
      {/* Vertical lines */}
      {colLines.map(i => (
        <GridLine
          key={`v-${i}`}
          className="vertical"
          style={{
            left: `${(i / cols) * 100}%`,
          }}
        />
      ))}
      
      {/* Horizontal lines */}
      {rowLines.map(i => (
        <GridLine
          key={`h-${i}`}
          className="horizontal"
          style={{
            top: `${(i / rows) * 100}%`,
          }}
        />
      ))}
    </OverlayContainer>
  );
}

export default GridOverlay;
