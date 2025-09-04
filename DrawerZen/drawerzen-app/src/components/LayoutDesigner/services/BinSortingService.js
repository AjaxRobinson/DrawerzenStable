export class BinSortingService {
  static sortBinsByArea(bins) {
    return [...bins].sort((a, b) => (b.width * b.length) - (a.width * a.length));
  }

  static findBestPosition(bin, gridCols, gridRows, placedBins) {
    // Check collision with existing bins
    const checkCollision = (newBin) => {
      return placedBins.some(existingBin => {
        const newBinRight = newBin.x + newBin.width;
        const newBinBottom = newBin.y + newBin.length;
        const existingBinRight = existingBin.x + existingBin.width;
        const existingBinBottom = existingBin.y + existingBin.length;
        
        return !(newBinRight <= existingBin.x || 
                 newBin.x >= existingBinRight || 
                 newBinBottom <= existingBin.y || 
                 newBin.y >= existingBinBottom);
      });
    };

    // Try to find the best position (top-left preference)
    for (let y = 0; y <= (gridRows * 21) - bin.length; y += 21) {
      for (let x = 0; x <= (gridCols * 21) - bin.width; x += 21) {
        const testBin = { ...bin, x, y };
        if (!checkCollision(testBin)) {
          return { x, y };
        }
      }
    }
    
    return null; // No valid position found
  }

  static autoSortBins(bins, gridCols, gridRows) {
    if (bins.length === 0) return [];

    // Sort bins by area (largest first)
    const sortedBins = this.sortBinsByArea(bins);
    const placedBins = [];
    const unplacedBins = [];

    // Try to place each bin
    for (const bin of sortedBins) {
      const position = this.findBestPosition(bin, gridCols, gridRows, placedBins);
      
      if (position) {
        placedBins.push({
          ...bin,
          x: position.x,
          y: position.y
        });
      } else {
        unplacedBins.push(bin);
      }
    }

    return { placedBins, unplacedBins };
  }

  static calculateOptimalSpacing(bins, gridCols, gridRows) {
    // Calculate total area of bins
    const totalBinArea = bins.reduce((sum, bin) => sum + (bin.width * bin.length), 0);
    const totalGridArea = (gridCols * 21) * (gridRows * 21);
    
    // Calculate utilization percentage
    const utilization = (totalBinArea / totalGridArea) * 100;
    
    return {
      totalBinArea,
      totalGridArea,
      utilization: Math.round(utilization * 100) / 100,
      availableSpace: totalGridArea - totalBinArea
    };
  }

  static findLargestGap(gridCols, gridRows, placedBins) {
    // Create a grid to mark occupied cells (in 21mm units)
    const totalWidth = gridCols * 21;
    const totalHeight = gridRows * 21;
    const grid = Array(gridRows).fill().map(() => Array(gridCols).fill(false));
    
    // Mark occupied cells
    placedBins.forEach(bin => {
      const startX = Math.floor(bin.x / 21);
      const startY = Math.floor(bin.y / 21);
      const binWidthCells = Math.ceil(bin.width / 21);
      const binLengthCells = Math.ceil(bin.length / 21);
      
      for (let y = startY; y < startY + binLengthCells && y < gridRows; y++) {
        for (let x = startX; x < startX + binWidthCells && x < gridCols; x++) {
          if (y >= 0 && x >= 0) {
            grid[y][x] = true;
          }
        }
      }
    });

    let largestGap = { x: 0, y: 0, width: 0, height: 0, area: 0 };

    // Find the largest rectangular gap
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        if (!grid[y][x]) {
          // Find the largest rectangle starting from this position
          const gap = this.findLargestRectangle(grid, x, y, gridCols, gridRows);
          if (gap.area > largestGap.area) {
            largestGap = gap;
          }
        }
      }
    }

    return largestGap;
  }

  static findAllGaps(gridCols, gridRows, placedBins, minArea = 2) {
    // Create a grid to mark occupied cells (in 21mm units)
    const grid = Array(gridRows).fill().map(() => Array(gridCols).fill(false));
    
    // Mark occupied cells
    placedBins.forEach(bin => {
      const startX = Math.floor(bin.x / 21);
      const startY = Math.floor(bin.y / 21);
      const binWidthCells = Math.ceil(bin.width / 21);
      const binLengthCells = Math.ceil(bin.length / 21);
      
      for (let y = startY; y < startY + binLengthCells && y < gridRows; y++) {
        for (let x = startX; x < startX + binWidthCells && x < gridCols; x++) {
          if (y >= 0 && x >= 0) {
            grid[y][x] = true;
          }
        }
      }
    });

    const gaps = [];
    const processedCells = Array(gridRows).fill().map(() => Array(gridCols).fill(false));

    // Find all rectangular gaps
    for (let y = 0; y < gridRows; y++) {
      for (let x = 0; x < gridCols; x++) {
        if (!grid[y][x] && !processedCells[y][x]) {
          // Find the largest rectangle starting from this position
          const gap = this.findLargestRectangle(grid, x, y, gridCols, gridRows);
          if (gap.area >= minArea) {
            gaps.push(gap);
            
            // Mark all cells in this rectangle as processed
            for (let gy = gap.y; gy < gap.y + gap.height; gy++) {
              for (let gx = gap.x; gx < gap.x + gap.width; gx++) {
                if (gy < gridRows && gx < gridCols) {
                  processedCells[gy][gx] = true;
                }
              }
            }
          } else {
            // Mark single cell as processed even if too small
            processedCells[y][x] = true;
          }
        }
      }
    }

    // Sort gaps by area (largest first)
    return gaps.sort((a, b) => b.area - a.area);
  }

  static findLargestRectangle(grid, startX, startY, gridCols, gridRows) {
    let maxArea = 0;
    let bestRect = { x: startX, y: startY, width: 0, height: 0, area: 0 };

    // Try different rectangle sizes
    for (let height = 1; startY + height <= gridRows; height++) {
      let width = 0;
      
      // Find maximum width for this height
      for (let w = 1; startX + w <= gridCols; w++) {
        let canExpand = true;
        
        // Check if we can expand to this width
        for (let y = startY; y < startY + height; y++) {
          if (grid[y][startX + w - 1]) {
            canExpand = false;
            break;
          }
        }
        
        if (canExpand) {
          width = w;
        } else {
          break;
        }
      }
      
      const area = width * height;
      if (area > maxArea) {
        maxArea = area;
        bestRect = {
          x: startX,
          y: startY,
          width,
          height,
          area
        };
      }
      
      // If width is 0, no point in trying larger heights
      if (width === 0) break;
    }

    return bestRect;
  }

  static checkValidPlacement(bin, existingBins, gridCols, gridRows) {
    // Check bounds
    const binRight = bin.x + bin.width;
    const binBottom = bin.y + bin.length;
    const gridWidth = gridCols * 21; // Convert to mm
    const gridHeight = gridRows * 21; // Convert to mm
    
    if (bin.x < 0 || bin.y < 0 || binRight > gridWidth || binBottom > gridHeight) {
      return false;
    }
    
    // Check collision with existing bins
    for (const existingBin of existingBins) {
      const existingBinRight = existingBin.x + existingBin.width;
      const existingBinBottom = existingBin.y + existingBin.length;
      
      const hasCollision = !(binRight <= existingBin.x || 
                            bin.x >= existingBinRight || 
                            binBottom <= existingBin.y || 
                            bin.y >= existingBinBottom);
      
      if (hasCollision) {
        return false;
      }
    }
    
    return true;
  }
}
