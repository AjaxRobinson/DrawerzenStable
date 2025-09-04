import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import exifr from 'exifr';

const PerspectiveGridRectifier = forwardRef(function PerspectiveGridRectifier({
  imageSrc,
  imageFile,
  drawerMM,
  gridCols = 10,
  gridRows = 10,
  pxPerMM = 15,
  onChange,
  onComplete
}, ref) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const imgRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 500 });
  const [imgMetrics, setImgMetrics] = useState({
    naturalWidth: 0,
    naturalHeight: 0,
    displayed: { x: 0, y: 0, width: 0, height: 0 }
  });
  const [dragState, setDragState] = useState({ isDragging: false, corner: null });
  const [quadDisplayPx, setQuadDisplayPx] = useState(null);
  const [dragEvents, setDragEvents] = useState(0);
  const startTimeRef = useRef(Date.now());
  const PADDING = 50;

  // Container resize handling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => {
      setContainerSize({ 
        width: el.clientWidth, 
        height: el.clientHeight 
      });
      if (imgRef.current?.complete) {
        computeDisplayedMetrics();
      }
    };

    resize();
    window.addEventListener('resize', resize);

    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(resize);
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', resize);
      ro?.disconnect();
    };
  }, []);

  // Image loading
  useEffect(() => {
    if (!imageSrc) return;
    
    const img = new Image();
    img.onload = () => {
      setImgMetrics(prev => ({ 
        ...prev, 
        naturalWidth: img.naturalWidth, 
        naturalHeight: img.naturalHeight 
      }));
      setTimeout(() => computeDisplayedMetrics(), 0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Compute container height
  const containerHeightPx = useMemo(() => {
    const defaultW = 900;
    const cw = containerRef.current?.clientWidth || defaultW;
    const { naturalWidth: iw, naturalHeight: ih } = imgMetrics;
    
    if (!iw || !ih) return 300;
    
    const ratio = iw / ih;
    const byWidth = Math.round(cw / Math.max(0.0001, ratio));
    const maxVH = Math.max(320, Math.floor(window.innerHeight * 0.6));
    
    return Math.max(300, Math.min(720, Math.min(byWidth, maxVH)));
  }, [imgMetrics.naturalWidth, imgMetrics.naturalHeight]);

  // Compute displayed image metrics
  const computeDisplayedMetrics = () => {
    const el = contentRef.current;
    const imgEl = imgRef.current;
    if (!el || !imgEl?.complete) return;

    const { clientWidth: cw, clientHeight: ch } = el;
    const { naturalWidth: iw, naturalHeight: ih } = imgEl;
    
    if (!iw || !ih) return;

    const containerRatio = cw / ch;
    const imageRatio = iw / ih;
    let w, h;
    
    if (imageRatio > containerRatio) {
      w = cw;
      h = w / imageRatio;
    } else {
      h = ch;
      w = h * imageRatio;
    }
    
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;

    setImgMetrics(prev => ({
      ...prev,
      displayed: { x, y, width: w, height: h }
    }));

    if (!quadDisplayPx) {
      const margin = Math.max(0, Math.min(w, h) * 0.001);
      const overhang = Math.max(6, Math.min(w, h) * 0.015);
      
      setQuadDisplayPx({
        topLeft: { x: Math.max(0, x - margin), y: Math.max(0, y - margin) },
        topRight: { x: Math.min(cw, x + w + margin), y: Math.max(0, y - margin) },
        bottomRight: { x: Math.min(cw, x + w + margin), y: Math.min(ch, y + h + margin) },
        bottomLeft: { x: Math.max(0, x - margin), y: Math.min(ch, y + h + margin) }
      });
    }
  };

  // Coordinate conversion
  const displayPtToImagePx = (pt) => {
    const { displayed, naturalWidth: iw, naturalHeight: ih } = imgMetrics;
    const sx = (pt.x - displayed.x) / displayed.width;
    const sy = (pt.y - displayed.y) / displayed.height;
    return { x: sx * iw, y: sy * ih };
  };

  const imageQuadPx = useMemo(() => {
    if (!quadDisplayPx) return null;
    
    return {
      topLeft: displayPtToImagePx(quadDisplayPx.topLeft),
      topRight: displayPtToImagePx(quadDisplayPx.topRight),
      bottomRight: displayPtToImagePx(quadDisplayPx.bottomRight),
      bottomLeft: displayPtToImagePx(quadDisplayPx.bottomLeft)
    };
  }, [quadDisplayPx, imgMetrics]);

  // Drag handlers
  const startDrag = (corner, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragState({ isDragging: true, corner });
  };

  useEffect(() => {
    if (!dragState.isDragging) return;

    const onMove = (e) => {
      setDragEvents(n => n + 1);
      
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const isTouch = e.touches?.[0];
      const clientX = isTouch ? e.touches[0].clientX : e.clientX;
      const clientY = isTouch ? e.touches[0].clientY : e.clientY;
      
      const cw = contentRef.current?.clientWidth || 0;
      const ch = contentRef.current?.clientHeight || 0;
      const x = Math.max(0, Math.min(cw, clientX - rect.left));
      const y = Math.max(0, Math.min(ch, clientY - rect.top));
      
      setQuadDisplayPx(prev => ({
        ...prev,
        [dragState.corner]: { x, y }
      }));
      
      onChange?.({ 
        quadDisplayPx: { 
          ...quadDisplayPx, 
          [dragState.corner]: { x, y } 
        } 
      });
    };

    const onEnd = () => setDragState({ isDragging: false, corner: null });

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, [dragState.isDragging, dragState.corner, quadDisplayPx, onChange]);

  // Homography computation
  const computeHomography = (srcPts, dstPts) => {
    const M = [];
    const b = [];
    
    for (let i = 0; i < 4; i++) {
      const { x, y } = srcPts[i];
      const { x: u, y: v } = dstPts[i];
      
      M.push([x, y, 1, 0, 0, 0, -u*x, -u*y]);
      b.push(u);
      
      M.push([0, 0, 0, x, y, 1, -v*x, -v*y]);
      b.push(v);
    }

    // Solve using Gaussian elimination
    const n = 8;
    const A = M.map((row, i) => [...row, b[i]]);
    
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) {
        if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
      }
      
      if (Math.abs(A[piv][col]) < 1e-12) {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
      }
      
      if (piv !== col) {
        [A[col], A[piv]] = [A[piv], A[col]];
      }
      
      const pv = A[col][col];
      for (let c = col; c <= n; c++) A[col][c] /= pv;
      
      for (let r = 0; r < n; r++) {
        if (r !== col) {
          const f = A[r][col];
          for (let c = col; c <= n; c++) {
            A[r][c] -= f * A[col][c];
          }
        }
      }
    }
    
    const h8 = A.map(r => r[n]);
    return [...h8, 1];
  };

  const invertHomography = (H) => {
    const m = [
      [H[0], H[1], H[2]],
      [H[3], H[4], H[5]],
      [H[6], H[7], H[8]]
    ];
    
    const inv = invert3x3(m);
    return [
      inv[0][0], inv[0][1], inv[0][2],
      inv[1][0], inv[1][1], inv[1][2],
      inv[2][0], inv[2][1], inv[2][2]
    ];
  };

  // Linear algebra helpers
  const invert3x3 = (m) => {
    const [a, b, c] = m[0];
    const [d, e, f] = m[1];
    const [g, h, i] = m[2];
    
    const A = e*i - f*h;
    const B = -(d*i - f*g);
    const C = d*h - e*g;
    const D = -(b*i - c*h);
    const E = a*i - c*g;
    const F = -(a*h - b*g);
    const G = b*f - c*e;
    const H = -(a*f - c*d);
    const I = a*e - b*d;
    
    const det = a*A + b*B + c*C;
    if (Math.abs(det) < 1e-12) {
      return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    }
    
    return [
      [A/det, D/det, G/det],
      [B/det, E/det, H/det],
      [C/det, F/det, I/det]
    ];
  };

  // Image warping
  const warpImage = async ({ targetW, targetH, srcPts }) => {
    const dstPts = [
      { x: 0, y: 0 },
      { x: targetW - 1, y: 0 },
      { x: targetW - 1, y: targetH - 1 },
      { x: 0, y: targetH - 1 }
    ];
    
    const H = computeHomography(srcPts, dstPts);
    const Hinv = invertHomography(H);
    
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageSrc;
    });
    
    const temp = document.createElement('canvas');
    temp.width = img.naturalWidth;
    temp.height = img.naturalHeight;
    const tctx = temp.getContext('2d');
    tctx.drawImage(img, 0, 0);
    
    const srcData = tctx.getImageData(0, 0, temp.width, temp.height);
    const sdata = srcData.data;
    const out = ctx.createImageData(targetW, targetH);
    const odata = out.data;
    
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const denom = Hinv[6] * x + Hinv[7] * y + Hinv[8];
        const u = (Hinv[0] * x + Hinv[1] * y + Hinv[2]) / denom;
        const v = (Hinv[3] * x + Hinv[4] * y + Hinv[5]) / denom;
        
        const x1 = Math.floor(u);
        const y1 = Math.floor(v);
        
        if (x1 < 0 || y1 < 0 || x1 >= temp.width - 1 || y1 >= temp.height - 1) continue;
        
        const fx = u - x1;
        const fy = v - y1;
        const idx = (px, py) => (py * temp.width + px) * 4;
        
        const i00 = idx(x1, y1);
        const i10 = idx(x1 + 1, y1);
        const i01 = idx(x1, y1 + 1);
        const i11 = idx(x1 + 1, y1 + 1);
        
        const r = sdata[i00] * (1 - fx) * (1 - fy) + 
                  sdata[i10] * fx * (1 - fy) + 
                  sdata[i01] * (1 - fx) * fy + 
                  sdata[i11] * fx * fy;
                  
        const g = sdata[i00 + 1] * (1 - fx) * (1 - fy) + 
                  sdata[i10 + 1] * fx * (1 - fy) + 
                  sdata[i01 + 1] * (1 - fx) * fy + 
                  sdata[i11 + 1] * fx * fy;
                  
        const b = sdata[i00 + 2] * (1 - fx) * (1 - fy) + 
                  sdata[i10 + 2] * fx * (1 - fy) + 
                  sdata[i01 + 2] * (1 - fx) * fy + 
                  sdata[i11 + 2] * fx * fy;
                  
        const a = sdata[i00 + 3] * (1 - fx) * (1 - fy) + 
                  sdata[i10 + 3] * fx * (1 - fy) + 
                  sdata[i01 + 3] * (1 - fx) * fy + 
                  sdata[i11 + 3] * fx * fy;
        
        const oi = (y * targetW + x) * 4;
        odata[oi] = r;
        odata[oi + 1] = g;
        odata[oi + 2] = b;
        odata[oi + 3] = a;
      }
    }
    
    ctx.putImageData(out, 0, 0);
    
    // Calculate reprojection error
    const err = srcPts.reduce((total, srcPt, i) => {
      const { x, y } = srcPt;
      const denom = H[6] * x + H[7] * y + H[8];
      const u = (H[0] * x + H[1] * y + H[2]) / denom;
      const v = (H[3] * x + H[4] * y + H[5]) / denom;
      const dx = u - dstPts[i].x;
      const dy = v - dstPts[i].y;
      return total + Math.sqrt(dx * dx + dy * dy);
    }, 0) / 4;
    
    return { 
      canvas, 
      homography: H, 
      fit_error_px: err, 
      origWidth: img.naturalWidth, 
      origHeight: img.naturalHeight 
    };
  };

  // Quad ordering
  const orderQuad = (pts, iw, ih) => {
    const clamped = pts.map(p => ({
      x: Math.max(0, Math.min(iw - 1, p.x)),
      y: Math.max(0, Math.min(ih - 1, p.y))
    }));
    
    const sortedByY = clamped.slice().sort((a, b) => a.y - b.y || a.x - b.x);
    const top = sortedByY.slice(0, 2).sort((a, b) => a.x - b.x);
    const bottom = sortedByY.slice(2).sort((a, b) => b.x - a.x);
    
    return [top[0], top[1], bottom[0], bottom[1]];
  };

  // Get source points
  const getSrcPts = () => {
    if (imageQuadPx) {
      const raw = [
        imageQuadPx.topLeft,
        imageQuadPx.topRight,
        imageQuadPx.bottomRight,
        imageQuadPx.bottomLeft
      ];
      return orderQuad(raw, imgMetrics.naturalWidth, imgMetrics.naturalHeight);
    }
    
    const d = imgMetrics.displayed;
    const tl = { x: d.x, y: d.y };
    const tr = { x: d.x + d.width, y: d.y };
    const br = { x: d.x + d.width, y: d.y + d.height };
    const bl = { x: d.x, y: d.y + d.height };
    
    return orderQuad([
      displayPtToImagePx(tl),
      displayPtToImagePx(tr),
      displayPtToImagePx(br),
      displayPtToImagePx(bl)
    ], imgMetrics.naturalWidth, imgMetrics.naturalHeight);
  };

  // Validation
  const validateQuad = (pts, iw, ih) => {
    if (!pts || pts.length !== 4) {
      return { ok: false, reason: 'Need 4 points' };
    }
    
    // Bounds check
    for (const p of pts) {
      if (p.x < 0 || p.y < 0 || p.x > iw || p.y > ih) {
        return { ok: false, reason: 'Point out of bounds' };
      }
    }
    
    // Distinctness check
    const distinct = new Set(pts.map(p => `${Math.round(p.x)}_${Math.round(p.y)}`));
    if (distinct.size < 4) {
      return { ok: false, reason: 'Points not distinct' };
    }
    
    // Convexity check
    const crossSigns = [];
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      const c = pts[(i + 2) % 4];
      
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const bcx = c.x - b.x;
      const bcy = c.y - b.y;
      
      const cross = abx * bcy - aby * bcx;
      crossSigns.push(cross);
    }
    
    const allPos = crossSigns.every(v => v > 0);
    const allNeg = crossSigns.every(v => v < 0);
    
    if (!(allPos || allNeg)) {
      return { ok: false, reason: 'Non-convex or self-intersecting quad' };
    }
    
    // Area check
    let area = 0;
    for (let i = 0; i < 4; i++) {
      const p = pts[i];
      const q = pts[(i + 1) % 4];
      area += p.x * q.y - q.x * p.y;
    }
    area = Math.abs(area) / 2;
    
    if (area < 25) {
      return { ok: false, reason: 'Quad area too small' };
    }
    
    const ordered = orderQuad(pts, iw, ih);
    return { ok: true, ordered, area, orientation: allPos ? 'CCW' : 'CW' };
  };

  // Main rectification function
  const handleConfirm = async () => {
    if (!imageQuadPx) {
      alert('Image not ready yet. Try again in a moment.');
      return null;
    }
    
    const hasDrawerDims = !!(drawerMM?.width && drawerMM?.length);
    let targetW, targetH, pxPerMMActual;
    
    if (hasDrawerDims) {
      targetW = Math.round(drawerMM.width * pxPerMM);
      targetH = Math.round(drawerMM.length * pxPerMM);
    } else {
      const srcPtsTemp = getSrcPts();
      const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
      
      const topW = dist(srcPtsTemp[0], srcPtsTemp[1]);
      const bottomW = dist(srcPtsTemp[3], srcPtsTemp[2]);
      const leftH = dist(srcPtsTemp[0], srcPtsTemp[3]);
      const rightH = dist(srcPtsTemp[1], srcPtsTemp[2]);
      
      const estW = (topW + bottomW) / 2;
      const estH = (leftH + rightH) / 2;
      const maxTarget = 1200;
      
      let scale = 1;
      if (Math.max(estW, estH) > maxTarget) {
        scale = maxTarget / Math.max(estW, estH);
      }
      
      targetW = Math.max(40, Math.round(estW * scale));
      targetH = Math.max(40, Math.round(estH * scale));
    }
    
    const maxPixels = 16000000;
    const canvasArea = targetW * targetH;
    
    if (canvasArea > maxPixels) {
      const scaleDown = Math.sqrt(maxPixels / canvasArea);
      targetW = Math.max(1, Math.round(targetW * scaleDown));
      targetH = Math.max(1, Math.round(targetH * scaleDown));
    }
    
    pxPerMMActual = hasDrawerDims ? { 
      x: targetW / drawerMM.width, 
      y: targetH / drawerMM.length 
    } : null;
    
    let srcPts = getSrcPts();
    const vres = validateQuad(srcPts, imgMetrics.naturalWidth, imgMetrics.naturalHeight);
    
    if (!vres.ok) {
      alert('Invalid selection: ' + vres.reason);
      console.warn('[Rectifier] validation failed', vres);
      return null;
    }
    
    if (vres.ordered) srcPts = vres.ordered;
    
    // Degenerate check
    const quadArea = (() => {
      let s = 0;
      for (let i = 0; i < 4; i++) {
        const p = srcPts[i];
        const q = srcPts[(i + 1) % 4];
        s += p.x * q.y - q.x * p.y;
      }
      return Math.abs(s) / 2;
    })();
    
    if (quadArea < 10) {
      console.warn('[Rectifier] Degenerate quad area (<10 px^2), aborting');
      return null;
    }
    
    const { canvas, homography, fit_error_px, origWidth, origHeight } = 
      await warpImage({ targetW, targetH, srcPts });
    
    // Projective strength
    const h33 = homography[8] || 1;
    const h31n = homography[6] / h33;
    const h32n = homography[7] / h33;
    const projMag = Math.sqrt(h31n * h31n + h32n * h32n);
    
    const rectifiedBlob = await new Promise(resolve => 
      canvas.toBlob(b => resolve(b), 'image/jpeg', 0.92)
    );
    const underlayImage = canvas.toDataURL('image/jpeg', 0.92);
    
    const metrics = {
      drag_events: dragEvents,
      ms_adjusting: Date.now() - startTimeRef.current
    };
    
    const quad_px = srcPts.map(p => [
      Number(p.x.toFixed(2)), 
      Number(p.y.toFixed(2))
    ]);
    
    // EXIF parsing
    let exif = null;
    if (imageFile) {
      try {
        const raw = await exifr.parse(imageFile, { 
          pick: ['FocalLength', 'FNumber', 'ISO'] 
        });
        if (raw) {
          exif = {
            focal_length_mm: raw.FocalLength || null,
            f_number: raw.FNumber || null,
            iso: raw.ISO || null
          };
        }
      } catch (e) {
        // Ignore EXIF errors
      }
    }
    
    const payload = {
      underlayImage,
      rectifiedBlob,
      quad_px,
      target_size_px: [targetW, targetH],
      homography: homography.map(v => Number(v.toFixed(8))),
      px_per_mm_after_rect: pxPerMMActual,
      metrics,
      exif,
      orig_size_px: [origWidth, origHeight],
      fit_error_px
    };
    
    try {
      sessionStorage.setItem('dz_last_underlay', underlayImage);
      sessionStorage.setItem('dz_last_rectify_meta', JSON.stringify({
        quad_px,
        target_size_px: [targetW, targetH],
        px_per_mm_after_rect: pxPerMMActual,
        orig_size_px: [origWidth, origHeight],
        homography: homography.map(v => Number(v.toFixed(8))),
        fit_error_px: Number((fit_error_px || 0).toFixed(4)),
        validation: vres || null,
        projective_strength: projMag
      }));
    } catch (e) {
      // Ignore storage errors
    }
    
    onComplete?.(payload);
    return payload;
  };

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    rectify: handleConfirm
  }), [imageQuadPx, drawerMM, pxPerMM]);

  // Grid SVG component
  const GridSVG = () => {
    if (!quadDisplayPx) return null;
    
    const colsF = Math.max(1, gridCols);
    const rowsF = Math.max(1, gridRows);
    
    const { topLeft: tl, topRight: tr, bottomRight: br, bottomLeft: bl } = quadDisplayPx;
    
    const interp = (a, b, t) => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    });
    
    const lines = [];
    
    // Vertical lines
    const vCols = Math.floor(colsF);
    const extraColFrac = colsF - vCols;
    const totalStepsX = vCols + (extraColFrac > 1e-6 ? 1 : 0);
    
    for (let i = 0; i <= totalStepsX; i++) {
      const u = i === totalStepsX && extraColFrac > 1e-6 ? 1 : (i / colsF);
      const p0 = interp(tl, tr, u);
      const p1 = interp(bl, br, u);
      lines.push(
        <polyline 
          key={`v${i}`} 
          points={`${p0.x},${p0.y} ${p1.x},${p1.y}`} 
          fill="none" 
          stroke="rgba(37,99,235,0.7)" 
          strokeWidth="1" 
        />
      );
    }
    
    // Horizontal lines
    const vRows = Math.floor(rowsF);
    const extraRowFrac = rowsF - vRows;
    const totalStepsY = vRows + (extraRowFrac > 1e-6 ? 1 : 0);
    
    for (let j = 0; j <= totalStepsY; j++) {
      const v = j === totalStepsY && extraRowFrac > 1e-6 ? 1 : (j / rowsF);
      const p0 = interp(tl, bl, v);
      const p1 = interp(tr, br, v);
      lines.push(
        <polyline 
          key={`h${j}`} 
          points={`${p0.x},${p0.y} ${p1.x},${p1.y}`} 
          fill="none" 
          stroke="rgba(37,99,235,0.7)" 
          strokeWidth="1" 
        />
      );
    }
    
    return <g>{lines}</g>;
  };

  const cornerStyle = {
    position: 'absolute',
    width: 16,
    height: 16,
    background: '#2563eb',
    border: '3px solid #fff',
    borderRadius: '50%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    cursor: 'move',
    transform: 'translate(-50%, -50%)',
    zIndex: 30
  };

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div 
        ref={containerRef} 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 900,
          height: containerHeightPx,
          minHeight: 380,
          border: '2px solid #e5e7eb',
          borderRadius: 8,
          background: '#fff',
          overflow: 'hidden'
        }}
      >
        <div 
          ref={contentRef} 
          style={{
            position: 'absolute',
            left: PADDING,
            top: PADDING,
            right: PADDING,
            bottom: PADDING
          }}
        >
          <img 
            ref={imgRef} 
            src={imageSrc} 
            alt="uploaded" 
            onLoad={computeDisplayedMetrics} 
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              userSelect: 'none',
              pointerEvents: 'none'
            }} 
          />

          {quadDisplayPx && (
            <svg 
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none'
              }}
            >
              <GridSVG />
              <polygon 
                points={`
                  ${quadDisplayPx.topLeft.x},${quadDisplayPx.topLeft.y} 
                  ${quadDisplayPx.topRight.x},${quadDisplayPx.topRight.y} 
                  ${quadDisplayPx.bottomRight.x},${quadDisplayPx.bottomRight.y} 
                  ${quadDisplayPx.bottomLeft.x},${quadDisplayPx.bottomLeft.y}
                `} 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="3" 
              />
            </svg>
          )}

          {quadDisplayPx && (
            <>
              <div 
                style={{ ...cornerStyle, left: quadDisplayPx.topLeft.x, top: quadDisplayPx.topLeft.y }} 
                onMouseDown={e => startDrag('topLeft', e)} 
                onTouchStart={e => startDrag('topLeft', e)} 
              />
              <div 
                style={{ ...cornerStyle, left: quadDisplayPx.topRight.x, top: quadDisplayPx.topRight.y }} 
                onMouseDown={e => startDrag('topRight', e)} 
                onTouchStart={e => startDrag('topRight', e)} 
              />
              <div 
                style={{ ...cornerStyle, left: quadDisplayPx.bottomRight.x, top: quadDisplayPx.bottomRight.y }} 
                onMouseDown={e => startDrag('bottomRight', e)} 
                onTouchStart={e => startDrag('bottomRight', e)} 
              />
              <div 
                style={{ ...cornerStyle, left: quadDisplayPx.bottomLeft.x, top: quadDisplayPx.bottomLeft.y }} 
                onMouseDown={e => startDrag('bottomLeft', e)} 
                onTouchStart={e => startDrag('bottomLeft', e)} 
              />
            </>
          )}
        </div>

        <div 
          style={{
            position: 'absolute',
            bottom: 2,
            left: 8,
            right: 8,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'flex-start',
            alignItems: 'center',
            pointerEvents: 'none'
          }}
        >
          <div 
            style={{
              color: '#fff',
              fontSize: 12,
              background: 'rgba(0,0,0,0.55)',
              padding: '6px 8px',
              borderRadius: 6,
              pointerEvents: 'auto'
            }}
          >
            Drag the blue corners to outline the drawer; initial shape exaggerates perspective so you can see the correction.
          </div>
          <PerspectiveStrength 
            homographyGetter={() => {
              try {
                const meta = JSON.parse(sessionStorage.getItem('dz_last_rectify_meta'));
                return meta?.homography || null;
              } catch {
                return null;
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
});

// Perspective strength component
const PerspectiveStrength = ({ homographyGetter }) => {
  const [strength, setStrength] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      const H = homographyGetter?.();
      if (!H || H.length < 9) {
        setStrength(null);
        return;
      }
      
      const h31 = H[6];
      const h32 = H[7];
      const mag = Math.sqrt(h31 * h31 + h32 * h32);
      
      let label;
      if (mag < 1e-5) label = 'none';
      else if (mag < 5e-5) label = 'very weak';
      else if (mag < 2e-4) label = 'weak';
      else if (mag < 8e-4) label = 'moderate';
      else label = 'strong';
      
      setStrength({ mag, label, h31, h32 });
    }, 800);
    
    return () => clearInterval(id);
  }, [homographyGetter]);

  return (
    <div 
      style={{
        color: '#fff',
        fontSize: 11,
        background: 'rgba(15,23,42,0.55)',
        padding: '4px 6px',
        borderRadius: 4,
        pointerEvents: 'auto'
      }}
    >
      <strong>Perspective:</strong> {
        strength ? 
        `${strength.label} (|h31,h32|≈${strength.mag.toExponential(2)})` : 
        'n/a'
      }
    </div>
  );
};

export default PerspectiveGridRectifier;