import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import GridOverlay from '../GridOverlay/GridOverlay';
import PerspectiveGridRectifier from './PerspectiveGridRectifier';
import SupabaseService from '../../services/SupabaseService';

const SetupContainer = styled.div`
  width: 100%;
  margin: 0 auto; /* Center the container */
  padding: ${props => props.$expanded ? '1rem' : '1rem'}; /* Standard spacing when expanded */
  padding-top: ${props => props.$expanded ? '1rem' : '1rem'}; /* Standard spacing from nav when expanded */
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(100vh - 80px); /* Fixed height to viewport minus navbar */
  max-height: calc(100vh - 80px); /* Ensure it never exceeds viewport */
  box-sizing: border-box;
  overflow-y: auto; /* Allow scrolling only if absolutely necessary */
  transition: padding 0.6s ease-in-out;
  
  @media (max-width: 768px) {
    padding: ${props => props.$expanded ? '0.75rem' : '0.75rem'};
    padding-top: ${props => props.$expanded ? '0.75rem' : '0.75rem'};
    height: calc(100vh - 70px);
    max-height: calc(100vh - 70px);
  }
`;

const Card = styled.div`
  background: white;
  padding: ${props => props.$expanded ? '1.5rem' : '2.5rem'}; /* Reduce padding when expanded */
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  margin-top: ${props => props.$expanded ? '0' : '2rem'};
  width: 100%;
  max-width: ${props => props.$expanded ? '95%' : '800px'};
  text-align: center;
  transition: all 0.6s ease-in-out;
  flex: 1; /* Allow it to grow and shrink within the container */
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  
  @media (max-width: 768px) {
    padding: ${props => props.$expanded ? '1rem' : '1.5rem'};
    max-width: 100%;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 600px; /* Prevent inputs from becoming too wide on large screens */
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem; /* Standard padding on left and right */
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 0; /* Remove side padding on mobile since card padding handles it */
    max-width: 100%;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  min-width: 0; /* Allows flex items to shrink below content size */
  width: 100%;
  box-sizing: border-box;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  @media (max-width: 768px) {
    min-width: 120px; /* Ensure minimum usable width on mobile */
  }
`;

const UnitToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    max-width: 250px;
  }
`;

const UnitButton = styled.button`
  flex: 1;
  padding: 0.5rem 1rem;
  background: ${props => props.$active ? '#4f46e5' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  margin-top: ${props => props.$expanded ? '1rem' : '2rem'}; /* Reduce margin when expanded */
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0; /* Don't let it shrink */
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const VisualPreview = styled.div`
  margin-top: 2rem;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px dashed #e5e7eb;
`;

const PreviewBox = styled.div`
  width: ${props => props.width}px;
  height: ${props => props.length}px;
  margin: 0 auto;
  background: white;
  border: 2px solid #4f46e5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
  transition: all 0.3s ease-in-out;
`;

// Define the animation using the keyframes helper
const waveAnimation = keyframes`
  0% { background-position: 200% 50%; }
  50% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const WavyPlaceholder = styled(PreviewBox)`
  background: linear-gradient(90deg, #f0f2f5, #e6e8ec, #f0f2f5);
  background-size: 200% 200%;
  animation: ${waveAnimation} 2s ease infinite; /* Apply the animation here */
  border-style: dashed;
  color: transparent;
`;

const ImageUpload = styled.input`
  margin-top: 1rem;
  padding: 0.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
`;

const UploadSection = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding: 0 1rem; /* Match the InputRow padding */
  
  @media (max-width: 768px) {
    padding: 0; /* Remove side padding on mobile */
  }
`;

const UploadLabel = styled.label`
  display: inline-block;
  padding: 1rem 2rem;
  background: #4f46e5;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
  }
  
  .desktop-text {
    display: inline;
    
    @media (max-width: 768px) {
      display: none;
    }
  }
  
  .mobile-text {
    display: none;
    
    @media (max-width: 768px) {
      display: inline;
    }
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PageTitle = styled.h1`
  text-align: center;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 700;
  opacity: ${props => props.$visible ? 1 : 0};
  max-height: ${props => props.$visible ? '200px' : '0'};
  overflow: hidden;
  transition: opacity 0.5s ease-in-out, max-height 0.5s ease-in-out, margin 0.5s ease-in-out;
  margin-bottom: ${props => props.$visible ? '0.5rem' : '0'};
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PageSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin-bottom: 2rem;
  font-size: 1.125rem;
  opacity: ${props => props.$visible ? 1 : 0};
  max-height: ${props => props.$visible ? '100px' : '0'};
  overflow: hidden;
  transition: opacity 0.5s ease-in-out 0.1s, max-height 0.5s ease-in-out 0.1s, margin 0.5s ease-in-out 0.1s;
  margin-bottom: ${props => props.$visible ? '2rem' : '0'};
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const GridOverlayContainer = styled.div`
  margin-top: ${props => props.$expanded ? '1rem' : '2rem'}; /* Reduce margin when expanded */
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  max-width: ${props => props.$expanded ? '90vw' : '100%'};
  flex: 1; /* Allow it to grow within available space */
  min-height: 0; /* Allow it to shrink */
  transition: all 0.6s ease-in-out;
`;

const ImageWithGrid = styled.div`
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: ${props => props.$expanded ? '45vh' : '300px'}; /* More conservative height when expanded */
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: max-height 0.6s ease-in-out;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const DrawerImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
`;

const GridOverlayOld = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image:
    linear-gradient(to right, rgba(79, 70, 229, 0.3) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(79, 70, 229, 0.3) 1px, transparent 1px);
  background-size: ${props => props.cellSize}px ${props => props.cellSize}px;
`;

const CropContainer = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.$expanded ? '45vh' : '400px'};
  max-width: 100%;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: height 0.6s ease-in-out;
`;

const CropControls = styled.div`
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
`;

const CropButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &.primary {
    background: #4f46e5;
    color: white;
    
    &:hover {
      background: #4338ca;
    }
  }
  
  &.secondary {
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: ${props => props.$expanded ? '45vh' : '300px'};
  border: 2px solid #4f46e5;
  border-radius: 8px;
  overflow: hidden;
  transition: max-height 0.6s ease-in-out;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const RecropButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(79, 70, 229, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(67, 56, 202, 0.9);
  }
`;

const GridInfo = styled.div`
  margin-top: ${props => props.$expanded ? '0.5rem' : '1rem'};
  padding: ${props => props.$expanded ? '0.75rem' : '1rem'};
  background: #f9fafb;
  border-radius: 8px;
  text-align: center;
  transition: all 0.6s ease-in-out;
  
  .grid-stats {
    display: flex;
    justify-content: center;
    gap: ${props => props.$expanded ? '1rem' : '2rem'};
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }
  
  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-value {
    font-weight: 600;
    color: #4f46e5;
    font-size: ${props => props.$expanded ? '1rem' : '1.1rem'};
  }
  
  .stat-label {
    font-size: ${props => props.$expanded ? '0.8rem' : '0.875rem'};
    color: #6b7280;
  }
`;

export default function DrawerSetup({ onComplete, initialDimensions, dataManager }) {
  const navigate = useNavigate();
  const rectifierRef = useRef(null);
  const [unit, setUnit] = useState('mm');
  // Canonical millimeter storage to prevent rounding drift
  const [baseDimensionsMM, setBaseDimensionsMM] = useState({
    width: initialDimensions?.width || '',
    length: initialDimensions?.length || '',
    height: initialDimensions?.height || ''
  });
  const formatDisplayVal = (mmVal) => {
    if (mmVal === '' || mmVal == null || isNaN(parseFloat(mmVal))) return '';
    const v = parseFloat(mmVal);
    return unit === 'mm' ? v.toFixed(1) : (v / 25.4).toFixed(1);
  };
  const [displayDims, setDisplayDims] = useState({
    width: formatDisplayVal(baseDimensionsMM.width),
    length: formatDisplayVal(baseDimensionsMM.length),
    height: formatDisplayVal(baseDimensionsMM.height)
  });
  useEffect(() => {
    setDisplayDims({
      width: formatDisplayVal(baseDimensionsMM.width),
      length: formatDisplayVal(baseDimensionsMM.length),
      height: formatDisplayVal(baseDimensionsMM.height)
    });
  }, [unit, baseDimensionsMM.width, baseDimensionsMM.length, baseDimensionsMM.height]);
  const handleInputChange = (field, val) => {
    setDisplayDims(prev => ({ ...prev, [field]: val }));
  };
  const handleInputBlur = (field, val) => {
    if (val === '') {
      setBaseDimensionsMM(prev => ({ ...prev, [field]: '' }));
      setDisplayDims(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const n = parseFloat(val);
    if (isNaN(n)) return;
    const mmUnclamped = unit === 'mm' ? n : n * 25.4;
    const limits = field === 'height' ? { min: 20, max: 300 } : { min: 42, max: 1000 };
    const mm = Math.max(limits.min, Math.min(limits.max, mmUnclamped));
    setBaseDimensionsMM(prev => ({ ...prev, [field]: mm }));
    setDisplayDims(prev => ({ ...prev, [field]: formatDisplayVal(mm) }));
    const prospective = { ...baseDimensionsMM, [field]: mm };
    if (prospective.width && prospective.length && prospective.height && dataManager) {
      dataManager.updateDrawerDimensions({
        width: parseFloat(prospective.width),
        length: parseFloat(prospective.length),
        height: parseFloat(prospective.height)
      });
    }
  };
  // Store original uploaded image (client-side)
  const [image, setImage] = useState(dataManager?.appData?.uploadedImage?.url || null);
  const [originalFile, setOriginalFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  // Store transform (corner positions)
  const [transform, setTransform] = useState(dataManager?.appData?.uploadedImage?.transform || null);
  // Store 4-corner deltas relative to grid center
  const [cornerDeltas, setCornerDeltas] = useState(null);
  // Store cropped image (client-side)
  const [croppedImage, setCroppedImage] = useState(null);
  // Store exported/cropped underlay image (for LayoutDesigner)
  const [underlayImage, setUnderlayImage] = useState(null);
  // Store rotated image
  const [rotatedImage, setRotatedImage] = useState(null);
  
  // Window resize handler to update orientation
  useEffect(() => {
    const handleResize = () => {
      // Trigger re-calculation when viewport orientation changes
      setBaseDimensionsMM(prev => ({ ...prev }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Track portrait mode for mobile continue button
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
      setBaseDimensionsMM(prev => ({ ...prev }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug logging
  console.log('DrawerSetup render - image state:', {
    image: !!image,
    imageLength: image?.length,
    baseDimensionsMM,
    uploading,
    transform: !!transform
  });

  // Clear image state when dataManager clears data
  useEffect(() => {
    if (!dataManager?.appData?.uploadedImage?.url) {
      setImage(null);
      setTransform(null);
    }
  }, [dataManager?.appData?.uploadedImage?.url]);

  // Clear dimensions when dataManager clears data
  useEffect(() => {
    if (!dataManager?.appData?.drawerDimensions) {
      setBaseDimensionsMM({ width: '', length: '', height: '' });
    }
  }, [dataManager?.appData?.drawerDimensions]);

  // Determine if container should be expanded (both image and dimensions are present)
  const isExpanded = image && baseDimensionsMM.width && baseDimensionsMM.length;
  
  // Show headers only when not expanded
  const showHeaders = !isExpanded;

  const handleImageUpload = (e) => {
    console.log('exicute for testing');
    setRotatedImage(null);
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const baseUrl = event.target.result;
        // Auto-rotate image to match viewport orientation (largest dimension alignment)
        const img = new Image();
        img.onload = () => {
          const viewportLandscape = window.innerWidth >= window.innerHeight;
          const imageLandscape = img.naturalWidth >= img.naturalHeight;
          let finalUrl = baseUrl;
          if (viewportLandscape !== imageLandscape) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalHeight;
              canvas.height = img.naturalWidth;
              const ctx = canvas.getContext('2d');
              ctx.save();
              ctx.translate(canvas.width / 2, canvas.height / 2);
              ctx.rotate(Math.PI / 2);
              ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
              ctx.restore();
              finalUrl = canvas.toDataURL('image/jpeg', 0.95);
            } catch (err) {
              console.warn('Auto-rotate failed, using original image', err);
            }
          }
          setImage(finalUrl);
          setOriginalFile(file);
          setCroppedImage(null);
          setTransform(null);
          setCornerDeltas(null);
          setUploading(false);
          if (dataManager) {
            dataManager.updateUploadedImage({ url: finalUrl, fileName: file.name });
          }
        };
        img.src = baseUrl;
      };
      reader.onerror = () => setUploading(false);
      reader.readAsDataURL(file);
    }
  };

  // Save transform and calculate 4-corner deltas relative to grid center
  const handleTransformChange = (newTransform, gridCenter) => {
    setTransform(newTransform);
    if (newTransform && gridCenter) {
      // Calculate deltas for each corner
      const deltas = {
        topLeft: {
          x: newTransform.topLeft.x - gridCenter.x,
          y: newTransform.topLeft.y - gridCenter.y
        },
        topRight: {
          x: newTransform.topRight.x - gridCenter.x,
          y: newTransform.topRight.y - gridCenter.y
        },
        bottomLeft: {
          x: newTransform.bottomLeft.x - gridCenter.x,
          y: newTransform.bottomLeft.y - gridCenter.y
        },
        bottomRight: {
          x: newTransform.bottomRight.x - gridCenter.x,
          y: newTransform.bottomRight.y - gridCenter.y
        }
      };
      setCornerDeltas(deltas);
    }
    if (dataManager) {
      dataManager.updateUploadedImage({ url: image, transform: newTransform });
    }
  };
  // Callback to receive the cropped/distorted image from FreeTransform
  const handleExportImage = (dataURL) => {
    setCroppedImage(dataURL);
    setUnderlayImage(dataURL);
    if (dataManager) {
      dataManager.updateUploadedImage({ ...dataManager.appData.uploadedImage, underlay: dataURL });
    }
  };

  // Helper: client info from UA (lightweight)
  const getClientInfo = () => {
    const ua = navigator.userAgent || '';
    let os = 'unknown', browser = 'unknown', device = 'desktop';
    if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    if (/Chrome\//i.test(ua)) browser = 'Chrome';
    else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Safari';
    else if (/Firefox\//i.test(ua)) browser = 'Firefox';
    else if (/Edg\//i.test(ua)) browser = 'Edge';
    if (/Mobi|Android|iPhone|iPad/i.test(ua)) device = 'mobile';
    return { device, os, browser };
  };

  // New: handle completion from PerspectiveGridRectifier
  const handleRectifierComplete = async (result) => {
    try {
      if (!result) return;
      const { underlayImage: rectUnderlay, rectifiedBlob, quad_px, target_size_px, homography, px_per_mm_after_rect, metrics, exif, orig_size_px } = result;

      // Update local state analogous to legacy cropped image handling
      setCroppedImage(rectUnderlay);
      setUnderlayImage(rectUnderlay);

      // Prepare metadata object
      const rectifyMeta = {
        quad_px,
        target_size_px,
        homography,
        px_per_mm_after_rect,
        metrics,
        exif,
        orig_size_px,
        drawer_mm: { width: drawerMM.width, length: drawerMM.length }
      };

      // Persist in data manager
      if (dataManager) {
        dataManager.updateUploadedImage({
          ...dataManager.appData.uploadedImage,
          underlay: rectUnderlay,
          rectifyMeta
        });
      }

      // Attempt Supabase uploads + record insert if configured
      if (SupabaseService.isEnabled()) {
        // Build sample id and storage keys per spec
        const now = new Date();
        const dateFolder = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
          .toISOString().slice(0, 10); // YYYY-MM-DD
        const rand = Math.random().toString(16).slice(2, 8);
        const isoStamp = new Date().toISOString().replace(/:/g, '-');
        const sampleId = `${isoStamp}_${rand}`; // e.g., 2025-08-11T17-12-33Z_4f7a2c
        const originalKey = `raw/${dateFolder}/${rand}.jpg`;
        const rectifiedKey = `rectified/${dateFolder}/${rand}.jpg`;

        let rawUpload, rectUpload;

        // Upload raw image file if available
        if (originalFile) {
          try {
            // Convert to JPEG if not already? For now, upload as-is using provided key
            rawUpload = await SupabaseService.uploadImage(originalKey, originalFile, originalFile.type || 'image/jpeg');
          } catch (e) { console.warn('Raw upload failed', e); }
        }

        // Upload rectified image
        if (rectifiedBlob) {
            try {
              rectUpload = await SupabaseService.uploadImage(rectifiedKey, rectifiedBlob, 'image/jpeg');
            } catch (e) { console.warn('Rectified upload failed', e); }
        }

        // Insert metadata record
        try {
          // Drawer dimensions (mm) from user input
          const width_mm = parseFloat(baseDimensionsMM.width);
          const length_mm = parseFloat(baseDimensionsMM.length);
          const depth_mm = parseFloat(baseDimensionsMM.height);
          // Quality metrics
          const quality = { user_confirmed: true, fit_error_px: 0 };
          const interaction_stats = { drag_events: metrics?.drag_events || 0, ms_adjusting: metrics?.ms_adjusting || 0 };
          const client = getClientInfo();

          const record = {
            sample_id: sampleId,
            image_original_key: originalKey,
            image_rectified_key: rectifiedKey,
            orig_size_px,
            quad_px,
            target_size_px,
            drawer_dims_mm: { width_mm, length_mm, depth_mm },
            px_per_mm_after_rect: { x: px_per_mm_after_rect?.x, y: px_per_mm_after_rect?.y },
            homography,
            quality,
            interaction_stats,
            client,
            exif
          };
          await SupabaseService.insertRecord(record);

          // Store identifiers locally for continuity
          if (dataManager) {
            dataManager.updateUploadedImage({
              ...dataManager.appData.uploadedImage,
              rectifyMeta: {
                ...rectifyMeta,
                sample_id: sampleId,
                image_original_key: originalKey,
                image_rectified_key: rectifiedKey
              }
            });
          }
        } catch (e) {
          console.warn('Supabase insert failed', e);
        }
      }
    } catch (err) {
      console.error('handleRectifierComplete error', err);
    }
  };

  const handleSubmit = async () => {
    // Single rectification pass (previously was executed twice)
    let rectifyResult = null;
    if (rectifierRef.current && image && baseDimensionsMM.width && baseDimensionsMM.length) {
      try {
        console.log('[DrawerSetup] Starting rectification before navigation...');
        const t0 = performance.now();
        rectifyResult = await rectifierRef.current.rectify();
        const dt = (performance.now() - t0).toFixed(1);
        if (rectifyResult?.underlayImage) {
          console.log('[DrawerSetup] Rectification complete', {
            ms: dt,
            dataUrlPrefix: rectifyResult.underlayImage.slice(0, 64),
            length: rectifyResult.underlayImage.length,
            target_size_px: rectifyResult.target_size_px,
            px_per_mm_after_rect: rectifyResult.px_per_mm_after_rect
          });
          setUnderlayImage(rectifyResult.underlayImage);
          setCroppedImage(rectifyResult.underlayImage);
          if (dataManager) {
            dataManager.updateUploadedImage({
              ...(dataManager.appData.uploadedImage || {}),
              underlay: rectifyResult.underlayImage,
              rectifyMeta: {
                quad_px: rectifyResult.quad_px,
                target_size_px: rectifyResult.target_size_px,
                homography: rectifyResult.homography,
                px_per_mm_after_rect: rectifyResult.px_per_mm_after_rect,
                metrics: rectifyResult.metrics,
                exif: rectifyResult.exif,
                orig_size_px: rectifyResult.orig_size_px,
                drawer_mm: { width: drawerMM.width, length: drawerMM.length }
              }
            });
          }
        } else {
          console.warn('[DrawerSetup] Rectification returned no underlayImage');
        }
      } catch (e) {
        console.warn('Rectify on continue failed', e);
      }
    } else {
      console.log('[DrawerSetup] Skipping rectification (missing ref or dimensions)');
    }
    // Replaced rawDimensions computation now using baseDimensionsMM
    const rawDimensions = {
      width: parseFloat(baseDimensionsMM.width),
      length: parseFloat(baseDimensionsMM.length),
      height: parseFloat(baseDimensionsMM.height),
      unit: 'mm'
    };

    // Skip Google Drive upload and spreadsheet logging

    // Use the just-produced rectified image if available (avoid re-running heavy process)
    const finalUnderlay = rectifyResult?.underlayImage || underlayImage || croppedImage || image;
    console.log('[DrawerSetup] Navigating to /layout with underlay summary', {
      source: rectifyResult?.underlayImage ? 'rectified' : (underlayImage ? 'state-underlay' : (croppedImage ? 'cropped' : 'original')),
      length: finalUnderlay?.length,
      prefix: finalUnderlay?.slice(0, 64)
    });
    onComplete({
      drawerDimensions: rawDimensions,
      underlayImage: finalUnderlay,
      transform,
      cornerDeltas
    });
    // Prefer passing underlay via navigation state for immediate availability in Layout
  const navUnderlay = finalUnderlay;
  navigate('/layout', { state: { underlayImage: navUnderlay } });
  };

  // Rotate image 90 degrees clockwise
  const handleRotateImage = () => {
    const src = rotatedImage || image;
    if (!src) return;
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
      const rotatedDataUrl = canvas.toDataURL();
      setRotatedImage(rotatedDataUrl);
      setImage(rotatedDataUrl);
      if (dataManager) {
        dataManager.updateUploadedImage({
          url: rotatedDataUrl
        });
      }
    };
    img.src = src;
  };

  const isValid = baseDimensionsMM.width && baseDimensionsMM.length && baseDimensionsMM.height && image;

  // Only allow submit if rectified underlay available
  const handleSubmitClick = () => {
    if (!isValid) return;
    // Trigger any additional validation or state updates if necessary
    handleSubmit();
  };

  // Compute drawer dims in mm and grid sizing for rectifier grid
  const getDrawerDimensionsInMM = () => {
    if (!baseDimensionsMM.width || !baseDimensionsMM.length) return { width: 0, length: 0 };
    return { width: parseFloat(baseDimensionsMM.width), length: parseFloat(baseDimensionsMM.length) };
  };
  const drawerMM = getDrawerDimensionsInMM();
  // Use fractional cell counts so partial cells are drawn at edges
  const gridCols = drawerMM.width > 0 ? (drawerMM.width / 21) : undefined;
  const gridRows = drawerMM.length > 0 ? (drawerMM.length / 21) : undefined;

  // Temporary debug preview toggle for rectified underlay
  const [showUnderlayPreview, setShowUnderlayPreview] = useState(true);
  // distortionTest tool removed

  return (
  <SetupContainer $expanded={isExpanded}>
      {showHeaders && (
        <>
      <PageTitle $visible={showHeaders}>Setup Your Drawer</PageTitle>
      <PageSubtitle $visible={showHeaders}>
            Upload an image of your sketch and set the drawer dimensions.
          </PageSubtitle>
        </>
      )}
    <Card $expanded={isExpanded}>
        {/* Drawer dimension inputs row */}
        <InputRow>
          <InputGroup>
            <Label>Width ({unit})</Label>
            <Input
              type="number"
              value={displayDims.width}
              onChange={(e) => handleInputChange('width', e.target.value)}
              onBlur={(e) => handleInputBlur('width', e.target.value)}
              placeholder={unit === 'mm' ? 'e.g. 400' : 'e.g. 15.7'}
              min={unit === 'mm' ? '42' : (42/25.4).toFixed(1)}
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>

          <InputGroup>
            <Label>Length ({unit})</Label>
            <Input
              type="number"
              value={displayDims.length}
              onChange={(e) => handleInputChange('length', e.target.value)}
              onBlur={(e) => handleInputBlur('length', e.target.value)}
              placeholder={unit === 'mm' ? 'e.g. 300' : 'e.g. 11.8'}
              min={unit === 'mm' ? '42' : (42/25.4).toFixed(1)}
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>

          <InputGroup>
            <Label>Height ({unit})</Label>
            <Input
              type="number"
              value={displayDims.height}
              onChange={(e) => handleInputChange('height', e.target.value)}
              onBlur={(e) => handleInputBlur('height', e.target.value)}
              placeholder={unit === 'mm' ? 'e.g. 50' : 'e.g. 2.0'}
              min={unit === 'mm' ? '20' : (20/25.4).toFixed(1)}
              step={unit === 'mm' ? '1' : '0.1'}
            />
          </InputGroup>
        </InputRow>

        {/* Unit toggle now below the input row */}
    <UnitToggle>
          <UnitButton $active={unit === 'mm'} onClick={() => setUnit('mm')}>Millimeters</UnitButton>
          <UnitButton $active={unit === 'inches'} onClick={() => setUnit('inches')}>Inches</UnitButton>
        </UnitToggle>

        <UploadSection>
          <UploadLabel>
            <span className="desktop-text">Upload Image</span>
            <span className="mobile-text">Upload</span>
            <HiddenFileInput
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </UploadLabel>
          {uploading && <p>Uploading image...</p>}
        </UploadSection>
        {image && (
          <div style={{width: '100%', maxWidth: 900, margin: '1rem auto'}}>
            <div style={{marginBottom: '0.5rem', textAlign: 'center'}}>
              <h3>Fit the Grid to Your Drawer</h3>
              <p style={{color: '#666', fontSize: '0.9rem', margin: '0.5rem 0'}}>
                Drag the blue corners to match your drawer. The red border is the crop.
              </p>
              {(!baseDimensionsMM.width || !baseDimensionsMM.length) && (
                <p style={{color: '#b45309', fontSize: '0.85rem', margin: 0}}>
                  Enter drawer width and length to enable rectification sizing.
                </p>
              )}
            </div>
            <PerspectiveGridRectifier
              ref={rectifierRef}
              imageSrc={image}
              imageFile={originalFile}
              drawerMM={drawerMM}
              gridCols={gridCols}
              gridRows={gridRows}
              pxPerMM={15}
              onComplete={handleRectifierComplete}
            />
            {/* Temporary Rectified Image Preview (Debug) */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              border: '2px dashed #3b82f6',
              borderRadius: 8,
              background: '#f0f9ff'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
                <strong style={{fontSize: '0.9rem'}}>Rectified Preview (debug)</strong>
                <div style={{display: 'flex', gap: '0.4rem'}}>
                  <button
                    type="button"
                    style={{
                      fontSize: '0.7rem',
                      background: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={async () => {
                      if (!rectifierRef.current) return;
                      try {
                        console.log('[DrawerSetup] Manual preview rectification triggered');
                        const t0 = performance.now();
                        const res = await rectifierRef.current.rectify();
                        const dt = (performance.now() - t0).toFixed(1);
                        if (res?.underlayImage) {
                          setUnderlayImage(res.underlayImage);
                          setCroppedImage(res.underlayImage);
                          if (dataManager) {
                            dataManager.updateUploadedImage({
                              ...(dataManager.appData.uploadedImage || {}),
                              underlay: res.underlayImage,
                              rectifyMeta: {
                                quad_px: res.quad_px,
                                target_size_px: res.target_size_px,
                                homography: res.homography,
                                px_per_mm_after_rect: res.px_per_mm_after_rect,
                                metrics: res.metrics,
                                exif: res.exif,
                                orig_size_px: res.orig_size_px,
                                drawer_mm: { width: drawerMM.width, length: drawerMM.length }
                              }
                            });
                          }
                          console.log('[DrawerSetup] Manual rectification complete (preview)', { ms: dt, len: res.underlayImage.length, quad_px: res.quad_px, fit_error_px: res.fit_error_px });
                        } else {
                          console.warn('[DrawerSetup] Rectification returned null/invalid result');
                          alert('Preview generation failed. Adjust the corners and try again.');
                        }
                      } catch (e) {
                        console.warn('Manual rectification failed', e);
                        alert('Preview generation error: ' + (e?.message || e));
                      }
                    }}
                  >Generate Preview</button>
                  <button
                    type="button"
                    style={{
                      fontSize: '0.7rem',
                      background: showUnderlayPreview ? '#1e3a8a' : '#64748b',
                      color: '#fff',
                      border: 'none',
                      padding: '0.35rem 0.6rem',
                      borderRadius: 4,
                      cursor: 'pointer'
                    }}
                    onClick={() => setShowUnderlayPreview(v => !v)}
                  >{showUnderlayPreview ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              {showUnderlayPreview && (
                underlayImage ? (
                  <>
                    <div style={{fontSize: '0.65rem', color: '#1e3a8a', marginTop: 4, wordBreak: 'break-all'}}>
                      data URL length: {underlayImage.length} • prefix: {underlayImage.slice(0,32)}
                    </div>
                    <div style={{marginTop: '0.5rem', display: 'flex', justifyContent: 'center'}}>
                      <img
                        src={underlayImage}
                        alt="Rectified Underlay Preview"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          objectFit: 'contain',
                          border: '1px solid #93c5fd',
                          background: '#fff'
                        }}
                      />
                    </div>
                    <div style={{fontSize: '0.6rem', color: '#1e40af', marginTop: 6}}>
                      This image will be passed to the Layout page as the underlay.
                    </div>
                  </>
                ) : (
                  <div style={{fontSize: '0.7rem', color: '#334155', marginTop: 6}}>
                    No rectified image yet. Adjust the grid then click "Generate Preview".
                  </div>
                )
              )}
            </div>
          </div>
        )}
        <SubmitButton
          $expanded={isExpanded}
          onClick={handleSubmitClick}
          disabled={!isValid || uploading}
        >
          {uploading ? 'Processing...' : 'Continue to Layout'}
        </SubmitButton>
      </Card>
    </SetupContainer>
  );
}