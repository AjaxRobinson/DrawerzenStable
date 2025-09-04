import React, { useState, useRef, useEffect } from 'react';

const FreeTransform = ({ 
  image, 
  containerWidth = 600, 
  containerHeight = 400, 
  onTransformChange,
  gridCols = 10,
  gridRows = 10,
  onExportImage // callback to export the cropped/distorted image
}) => {
  // Determine if we need to rotate the image based on aspect ratios
  const [imageNaturalSize, setImageNaturalSize] = useState({ width: 0, height: 0 });
  const [needsRotation, setNeedsRotation] = useState(false);
  
  // Calculate initial transform state - simple rectangle positioning
  const getInitialTransform = () => {
    const margin = 50;
    
    // Always start with a simple rectangle regardless of image orientation
    return {
      topLeft: { x: margin, y: margin },
      topRight: { x: containerWidth - margin, y: margin },
      bottomLeft: { x: margin, y: containerHeight - margin },
      bottomRight: { x: containerWidth - margin, y: containerHeight - margin }
    };
  };
  
  // Transform state - represents the actual corners of the image
  const [imageCorners, setImageCorners] = useState(getInitialTransform());
  
  // Update transform when container size changes
  useEffect(() => {
    setImageCorners(getInitialTransform());
  }, [containerWidth, containerHeight]);
  
  // Simple image loading without rotation detection
  useEffect(() => {
    if (!image) return;
    
    const img = new Image();
    img.onload = () => {
      setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      // No rotation needed - just use simple corner transform
      setNeedsRotation(false);
    };
    img.src = image;
  }, [image]);
  
  const [dragState, setDragState] = useState({
    isDragging: false,
    corner: null
  });
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Handle mouse events
  const handleMouseDown = (corner, event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragState({
      isDragging: true,
      corner
    });
  };
  
  const handleMouseMove = (event) => {
    if (!dragState.isDragging || !dragState.corner || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // Allow dragging beyond container bounds for proper free transform
    const newX = event.clientX - rect.left;
    const newY = event.clientY - rect.top;
    
    // Only update the corner being dragged, keep others fixed
    setImageCorners(prev => ({
      ...prev,
      [dragState.corner]: { x: newX, y: newY }
    }));
  };
  
  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      corner: null
    });
  };
  
  // Global mouse events
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, dragState.corner]);
  
  // Notify parent of transform changes
  useEffect(() => {
    if (onTransformChange) {
      onTransformChange(imageCorners);
    }
    // Export the cropped/distorted image as a dataURL
    if (onExportImage && canvasRef.current) {
      // Wait for canvas to finish drawing
      setTimeout(() => {
        if (canvasRef.current) {
          const dataURL = canvasRef.current.toDataURL('image/png');
          onExportImage(dataURL);
        }
      }, 100);
    }
  }, [imageCorners, onTransformChange, onExportImage]);
  
  // Draw the image on canvas with true 4-point transformation
  useEffect(() => {
    if (!canvasRef.current || !image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { topLeft, topRight, bottomLeft, bottomRight } = imageCorners;

      // Use bilinear interpolation to map the image to all 4 corners
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Create a temporary canvas to get image pixel data
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = img.naturalWidth;
      tempCanvas.height = img.naturalHeight;
      tempCtx.drawImage(img, 0, 0);

      const sourceImageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const sourceData = sourceImageData.data;

      // For each pixel in the destination canvas
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          // Check if this pixel is inside the quadrilateral
          if (isPointInQuad(x, y, topLeft, topRight, bottomLeft, bottomRight)) {
            // Find the corresponding point in the source image using bilinear interpolation
            const uv = getQuadUV(x, y, topLeft, topRight, bottomLeft, bottomRight);

            if (uv) {
              // Map UV coordinates to source image coordinates
              const sourceX = uv.u * (tempCanvas.width - 1);
              const sourceY = uv.v * (tempCanvas.height - 1);

              // Bilinear interpolation in source image
              const x1 = Math.floor(sourceX);
              const y1 = Math.floor(sourceY);
              const x2 = Math.min(x1 + 1, tempCanvas.width - 1);
              const y2 = Math.min(y1 + 1, tempCanvas.height - 1);

              const fx = sourceX - x1;
              const fy = sourceY - y1;

              // Get four neighboring pixels
              const getPixel = (px, py) => {
                const idx = (py * tempCanvas.width + px) * 4;
                return {
                  r: sourceData[idx],
                  g: sourceData[idx + 1],
                  b: sourceData[idx + 2],
                  a: sourceData[idx + 3]
                };
              };

              const p1 = getPixel(x1, y1);
              const p2 = getPixel(x2, y1);
              const p3 = getPixel(x1, y2);
              const p4 = getPixel(x2, y2);

              // Interpolate
              const r = Math.round(
                p1.r * (1 - fx) * (1 - fy) +
                p2.r * fx * (1 - fy) +
                p3.r * (1 - fx) * fy +
                p4.r * fx * fy
              );
              const g = Math.round(
                p1.g * (1 - fx) * (1 - fy) +
                p2.g * fx * (1 - fy) +
                p3.g * (1 - fx) * fy +
                p4.g * fx * fy
              );
              const b = Math.round(
                p1.b * (1 - fx) * (1 - fy) +
                p2.b * fx * (1 - fy) +
                p3.b * (1 - fx) * fy +
                p4.b * fx * fy
              );
              const a = Math.round(
                p1.a * (1 - fx) * (1 - fy) +
                p2.a * fx * (1 - fy) +
                p3.a * (1 - fx) * fy +
                p4.a * fx * fy
              );

              // Set destination pixel
              const destIdx = (y * canvas.width + x) * 4;
              data[destIdx] = r;
              data[destIdx + 1] = g;
              data[destIdx + 2] = b;
              data[destIdx + 3] = a;
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };

    img.src = image;
  }, [image, imageCorners]);

  // Helper function to check if a point is inside the quadrilateral
  const isPointInQuad = (x, y, tl, tr, bl, br) => {
    // Use cross product to check if point is on correct side of each edge
    const sign = (p1, p2, p3) => (p1.x - p3.x) * (p2.y - p3.y) - (p2.x - p3.x) * (p1.y - p3.y);

    const d1 = sign({x, y}, tl, tr);
    const d2 = sign({x, y}, tr, br);
    const d3 = sign({x, y}, br, bl);
    const d4 = sign({x, y}, bl, tl);

    const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0) || (d4 < 0);
    const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0) || (d4 > 0);

    return !(hasNeg && hasPos);
  };

  // Helper function to get UV coordinates within the quadrilateral
  const getQuadUV = (x, y, tl, tr, bl, br) => {
    // Use bilinear interpolation to find UV coordinates
    // This is an approximation - true perspective mapping is more complex

    // Find the intersection of lines through the point parallel to quad edges
    const p = {x, y};

    // Approximate UV by solving the bilinear interpolation equation
    // p = tl*(1-u)*(1-v) + tr*u*(1-v) + bl*(1-u)*v + br*u*v

    // Use iterative approach to solve for u,v
    let u = 0.5, v = 0.5;

    for (let i = 0; i < 10; i++) {
      const interpolated = {
        x: tl.x * (1-u) * (1-v) + tr.x * u * (1-v) + bl.x * (1-u) * v + br.x * u * v,
        y: tl.y * (1-u) * (1-v) + tr.y * u * (1-v) + bl.y * (1-u) * v + br.y * u * v
      };

      const dx = p.x - interpolated.x;
      const dy = p.y - interpolated.y;

      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) break;

      // Jacobian matrix for Newton-Raphson iteration
      const dxdu = -tl.x * (1-v) + tr.x * (1-v) - bl.x * v + br.x * v;
      const dxdv = -tl.x * (1-u) - tr.x * u + bl.x * (1-u) + br.x * u;
      const dydu = -tl.y * (1-v) + tr.y * (1-v) - bl.y * v + br.y * v;
      const dydv = -tl.y * (1-u) - tr.y * u + bl.y * (1-u) + br.y * u;

      const det = dxdu * dydv - dxdv * dydu;
      if (Math.abs(det) < 1e-10) break;

      const du = (dydv * dx - dxdv * dy) / det;
      const dv = (dxdu * dy - dydu * dx) / det;

      u += du * 0.5;
      v += dv * 0.5;

      u = Math.max(0, Math.min(1, u));
      v = Math.max(0, Math.min(1, v));
    }

    return {u, v};
  };
  
  const cornerStyle = {
    position: 'absolute',
    width: '16px',
    height: '16px',
    backgroundColor: '#4f46e5',
    border: '3px solid white',
    borderRadius: '50%',
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    userSelect: 'none'
  };
  
  const activeDragCornerStyle = {
    ...cornerStyle,
    backgroundColor: '#ef4444',
    transform: 'translate(-50%, -50%) scale(1.2)'
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem 0' }}>
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: containerWidth,
          height: containerHeight,
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'visible',
          userSelect: 'none',
          backgroundColor: '#f9fafb'
        }}
      >
        {/* Canvas for transformed image */}
        <canvas
          ref={canvasRef}
          width={containerWidth}
          height={containerHeight}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%'
          }}
        />

        {/* Grid overlay - allow partial grid squares */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 500
          }}
          width={containerWidth}
          height={containerHeight}
        >
          {/* Draw vertical grid lines */}
          {Array.from({ length: gridCols + 1 }).map((_, i) => {
            const x = (i * containerWidth) / gridCols;
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={containerHeight} stroke="rgba(79,70,229,0.6)" strokeWidth="1" />;
          })}
          {/* Draw horizontal grid lines */}
          {Array.from({ length: gridRows + 1 }).map((_, i) => {
            const y = (i * containerHeight) / gridRows;
            return <line key={`h${i}`} x1={0} y1={y} x2={containerWidth} y2={y} stroke="rgba(79,70,229,0.6)" strokeWidth="1" />;
          })}
        </svg>

        {/* Crop area overlay to show what will be kept */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            border: '3px solid #ef4444',
            borderRadius: '4px',
            zIndex: 600,
            boxShadow: 'inset 0 0 0 2px rgba(239, 68, 68, 0.1)'
          }}
        />

        {/* Transform outline - shows the bounds of the image with corner indicators */}
        <svg
          style={{
            position: 'absolute',
            top: '-200px',
            left: '-200px',
            width: containerWidth + 400,
            height: containerHeight + 400,
            pointerEvents: 'none',
            zIndex: 800,
            overflow: 'visible'
          }}
          viewBox={`-200 -200 ${containerWidth + 400} ${containerHeight + 400}`}
        >
          {/* Image outline polygon */}
          <polygon
            points={`${imageCorners.topLeft.x},${imageCorners.topLeft.y} ${imageCorners.topRight.x},${imageCorners.topRight.y} ${imageCorners.bottomRight.x},${imageCorners.bottomRight.y} ${imageCorners.bottomLeft.x},${imageCorners.bottomLeft.y}`}
            fill="rgba(79,70,229,0.05)"
            stroke="#4f46e5"
            strokeWidth="2"
            strokeDasharray="8,4"
          />
          {/* Draw thick lines connecting corners to show the image bounds clearly */}
          <line
            x1={imageCorners.topLeft.x} y1={imageCorners.topLeft.y}
            x2={imageCorners.topRight.x} y2={imageCorners.topRight.y}
            stroke="#4f46e5" strokeWidth="4" opacity="0.9"
          />
          <line
            x1={imageCorners.topRight.x} y1={imageCorners.topRight.y}
            x2={imageCorners.bottomRight.x} y2={imageCorners.bottomRight.y}
            stroke="#4f46e5" strokeWidth="4" opacity="0.9"
          />
          <line
            x1={imageCorners.bottomRight.x} y1={imageCorners.bottomRight.y}
            x2={imageCorners.bottomLeft.x} y2={imageCorners.bottomLeft.y}
            stroke="#4f46e5" strokeWidth="4" opacity="0.9"
          />
          <line
            x1={imageCorners.bottomLeft.x} y1={imageCorners.bottomLeft.y}
            x2={imageCorners.topLeft.x} y2={imageCorners.topLeft.y}
            stroke="#4f46e5" strokeWidth="4" opacity="0.9"
          />
          {/* Corner position indicators */}
          <circle cx={imageCorners.topLeft.x} cy={imageCorners.topLeft.y} r="3" fill="#4f46e5" opacity="0.7" />
          <circle cx={imageCorners.topRight.x} cy={imageCorners.topRight.y} r="3" fill="#4f46e5" opacity="0.7" />
          <circle cx={imageCorners.bottomLeft.x} cy={imageCorners.bottomLeft.y} r="3" fill="#4f46e5" opacity="0.7" />
          <circle cx={imageCorners.bottomRight.x} cy={imageCorners.bottomRight.y} r="3" fill="#4f46e5" opacity="0.7" />
        </svg>

        {/* Corner handles - can extend beyond container */}
        <div
          style={{
            ...(dragState.corner === 'topLeft' ? activeDragCornerStyle : cornerStyle),
            left: imageCorners.topLeft.x,
            top: imageCorners.topLeft.y
          }}
          onMouseDown={(e) => handleMouseDown('topLeft', e)}
          title="Drag to adjust top-left corner of image"
        />
        <div
          style={{
            ...(dragState.corner === 'topRight' ? activeDragCornerStyle : cornerStyle),
            left: imageCorners.topRight.x,
            top: imageCorners.topRight.y
          }}
          onMouseDown={(e) => handleMouseDown('topRight', e)}
          title="Drag to adjust top-right corner of image"
        />
        <div
          style={{
            ...(dragState.corner === 'bottomLeft' ? activeDragCornerStyle : cornerStyle),
            left: imageCorners.bottomLeft.x,
            top: imageCorners.bottomLeft.y
          }}
          onMouseDown={(e) => handleMouseDown('bottomLeft', e)}
          title="Drag to adjust bottom-left corner of image"
        />
        <div
          style={{
            ...(dragState.corner === 'bottomRight' ? activeDragCornerStyle : cornerStyle),
            left: imageCorners.bottomRight.x,
            top: imageCorners.bottomRight.y
          }}
          onMouseDown={(e) => handleMouseDown('bottomRight', e)}
          title="Drag to adjust bottom-right corner of image"
        />
      </div>
      {/* Instructions box below grid */}
      <div
        style={{
          marginTop: '16px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '0.8rem',
          textAlign: 'center',
          maxWidth: containerWidth,
          zIndex: 900
        }}
      >
        <div><strong>Blue outline:</strong> Your image bounds (drag corners independently)</div>
        <div><strong>Red border:</strong> Final crop area</div>
        <div><strong>Grid:</strong> 21mm measurement cells (partial squares shown for true scale)</div>
      </div>
    </div>
  );
};

export default FreeTransform;
