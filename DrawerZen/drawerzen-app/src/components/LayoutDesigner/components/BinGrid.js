import React, { forwardRef, useMemo, useEffect } from 'react';
import DraggablePlacedBin from './DraggablePlacedBin';
import { 
  Grid, 
  GridCell,
  DrawingOverlay, 
  DrawingPreview, 
  DropShadow 
} from '../LayoutDesigner.styles';

const BinGrid = forwardRef(({
  gridCols,
  gridRows,
  cellSize,
  placedBins,
  selectedBin,
  onBinClick,
  onBinDoubleClick,
  draggedBin,
  onDragStart,
  onDragEnd,
  dropShadow,
  onGridHover,
  onGridDrop,
  drawingContainerRef,
  isDrawing,
  drawingPreview,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  underlayImage,
  onFocusBin,
  onBlurBin
}, ref) => {
  const safeGridCols = Math.max(1, gridCols || 1);
  const safeGridRows = Math.max(1, gridRows || 1);
  const safeCellSize = Math.max(10, cellSize || 20);

  const gridCells = useMemo(() => Array.from({ length: safeGridRows * safeGridCols }, (_, index) => {
    const row = Math.floor(index / safeGridCols);
    const col = index % safeGridCols;
    const hasTopEmphasis = row % 2 === 0;
    const hasLeftEmphasis = col % 2 === 0;
    return (
      <GridCell 
        key={index} 
        $cellSize={safeCellSize}
        $hasTopEmphasis={hasTopEmphasis}
        $hasLeftEmphasis={hasLeftEmphasis}
      />
    );
  }), [safeGridCols, safeGridRows, safeCellSize]);

  const placedBinElements = useMemo(() => placedBins.map(bin => (
    <DraggablePlacedBin
      key={bin.id}
      bin={bin}
      cellSize={cellSize}
      selected={selectedBin?.id === bin.id}
      isDragging={draggedBin?.id === bin.id}
      onClick={() => onBinClick(bin)}
      onDoubleClick={() => onBinDoubleClick(bin)}
      onDragStart={() => onDragStart(bin)}
      onDragEnd={onDragEnd}
      onFocusBin={onFocusBin}
      onBlurBin={onBlurBin}
    />
  )), [placedBins, cellSize, selectedBin?.id, draggedBin?.id, onBinClick, onBinDoubleClick, onDragStart, onDragEnd, onFocusBin, onBlurBin]);

  // Debug: watch underlay changes
  useEffect(() => {
    if (underlayImage) {
      console.log('[BinGrid] applying underlayImage len/prefix:', underlayImage.length, underlayImage.slice(0, 48));
    } else {
      console.log('[BinGrid] no underlayImage');
    }
  }, [underlayImage]);

  return (
    <Grid 
      $cols={safeGridCols} 
      $rows={safeGridRows} 
      $cellSize={safeCellSize}
      ref={(el) => {
        if (drawingContainerRef) drawingContainerRef.current = el;
        if (ref) ref(el);
      }}
      data-grid="true"
    >
      {gridCells}
      {/* Drawing overlay */}
      <DrawingOverlay
        onMouseDown={draggedBin ? undefined : onMouseDown}
        onMouseMove={draggedBin ? undefined : onMouseMove}
        onMouseUp={draggedBin ? undefined : onMouseUp}
        style={{ pointerEvents: draggedBin ? 'none' : 'auto' }}
      />
      {/* Drawing preview */}
      {isDrawing && drawingPreview && (
        <DrawingPreview
          style={{
            left: drawingPreview.left,
            top: drawingPreview.top,
            width: drawingPreview.width,
            height: drawingPreview.height
          }}
          $error={drawingPreview.hasError}
        />
      )}
      {/* Drop shadow */}
    {dropShadow && (
        <DropShadow
          style={{
            left: dropShadow.left,
            top: dropShadow.top,
            width: dropShadow.width,
            height: dropShadow.height
          }}
      $visible={dropShadow.visible}
      $error={dropShadow.error}
        />
      )}
      {/* Placed bins */}
      {placedBinElements}
    </Grid>
  );
});

BinGrid.displayName = 'BinGrid';

export default React.memo(BinGrid);
