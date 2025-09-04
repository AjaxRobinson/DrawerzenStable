import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import PerspectiveGridRectifier from './PerspectiveGridRectifier';
import SupabaseService from '../../services/SupabaseService';

// Responsive utility
const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px'
};

const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (max-width: ${breakpoints.desktop})`
};

const SetupContainer = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: ${props => props.$expanded ? '0.75rem' : '1rem'};
  padding-top: ${props => props.$expanded ? '0.75rem' : '1rem'};
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 80px);
  box-sizing: border-box;
  overflow-y: auto;
  transition: padding 0.3s ease-in-out;
  
  ${media.tablet} {
    padding: ${props => props.$expanded ? '0.5rem' : '0.75rem'};
    padding-top: ${props => props.$expanded ? '0.5rem' : '0.75rem'};
    min-height: calc(100vh - 70px);
  }
  
  ${media.mobile} {
    padding: 0.5rem;
    padding-top: 0.75rem;
  }
`;

const Card = styled.div`
  background: white;
  padding: ${props => props.$expanded ? '1rem' : '1.5rem'};
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.08);
  margin-top: ${props => props.$expanded ? '0' : '1rem'};
  width: 100%;
  max-width: ${props => props.$expanded ? '100%' : '800px'};
  text-align: center;
  transition: all 0.3s ease-in-out;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  
  ${media.tablet} {
    padding: ${props => props.$expanded ? '0.75rem' : '1rem'};
    border-radius: 10px;
  }
  
  ${media.mobile} {
    padding: 0.75rem;
    margin-top: 0.5rem;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 0.5rem;
  box-sizing: border-box;
  flex-direction: column;
  
  ${media.tablet} {
    gap: 0.75rem;
    padding: 0;
    max-width: 100%;
  }
  
  ${media.mobile} {
    gap: 0.5rem;
  }
`;

const InputGroup = styled.div`
  flex: 1;
  text-align: left;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.4rem;
  color: #374151;
  font-size: 0.85rem;
  
  ${media.mobile} {
    font-size: 0.8rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  background: #f9fafb;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
    font-size: 0.9rem;
  }
  
  ${media.mobile} {
    padding: 0.55rem;
    font-size: 0.9rem;
  }
`;

const UnitToggle = styled.div`
  display: flex;
  background: #f3f4f6;
  border-radius: 6px;
  padding: 0.2rem;
  margin-bottom: 1rem;
  width: 100%;
  max-width: 260px;
  margin-left: auto;
  margin-right: auto;
  
  ${media.mobile} {
    max-width: 220px;
    padding: 0.15rem;
  }
`;

const UnitButton = styled.button`
  flex: 1;
  padding: 0.45rem 0.75rem;
  background: ${props => props.$active ? '#4f46e5' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#6b7280'};
  border: none;
  border-radius: 5px;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s;
  cursor: pointer;
  
  &:hover {
    background: ${props => props.$active ? '#4338ca' : '#e5e7eb'};
  }
  
  ${media.mobile} {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
`;
const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;
const SubmitButton = styled.button`
  width: 100%;
  padding: 0.9rem;
  margin-top: ${props => props.$expanded ? '0.75rem' : '1rem'};
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(79, 70, 229, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  ${media.mobile} {
    padding: 0.8rem;
    font-size: 0.95rem;
    margin-top: 0.75rem;
  }
`;
const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: ${spin} 1s linear infinite;
`;

const UploadLabel = styled.label`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: #4f46e5;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s;
  margin: 0.5rem 0;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(79, 70, 229, 0.3);
  }
  
  ${media.mobile} {
    padding: 0.65rem 1.25rem;
    font-size: 0.85rem;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PageTitle = styled.h1`
  text-align: center;
  color: #111827;
  margin-bottom: 0.4rem;
  font-size: 1.75rem;
  font-weight: 700;
  opacity: ${props => props.$visible ? 1 : 0};
  max-height: ${props => props.$visible ? '200px' : '0'};
  overflow: hidden;
  transition: opacity 0.3s ease-in-out, max-height 0.3s ease-in-out, margin 0.3s ease-in-out;
  margin-bottom: ${props => props.$visible ? '0.4rem' : '0'};
  
  ${media.tablet} {
    font-size: 1.5rem;
  }
  
  ${media.mobile} {
    font-size: 1.35rem;
    margin-bottom: 0.3rem;
  }
`;

const PageSubtitle = styled.p`
  text-align: center;
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  line-height: 1.4;
  opacity: ${props => props.$visible ? 1 : 0};
  max-height: ${props => props.$visible ? '100px' : '0'};
  overflow: hidden;
  transition: opacity 0.3s ease-in-out 0.1s, max-height 0.3s ease-in-out 0.1s, margin 0.3s ease-in-out 0.1s;
  margin-bottom: ${props => props.$visible ? '1rem' : '0'};
  
  ${media.tablet} {
    font-size: 0.9rem;
  }
  
  ${media.mobile} {
    font-size: 0.85rem;
    margin-bottom: 0.75rem;
  }
`;

const PreviewSection = styled.div`
  width: 100%;
  max-width: 900px;
  margin: 0.75rem auto;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  
  ${media.mobile} {
    padding: 0.5rem;
    margin: 0.5rem auto;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.4rem 0;
  color: #111827;
  font-size: 1rem;
  
  ${media.mobile} {
    font-size: 0.95rem;
  }
`;

const SectionDescription = styled.p`
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0.4rem 0 0.75rem;
  line-height: 1.4;
  
  ${media.mobile} {
    font-size: 0.8rem;
  }
`;

const WarningText = styled.p`
  color: #b45309;
  font-size: 0.8rem;
  margin: 0.4rem 0 0;
  
  ${media.mobile} {
    font-size: 0.75rem;
  }
`;

const DebugPanel = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  border: 1px dashed #3b82f6;
  border-radius: 6px;
  background: #f0f9ff;
  
  ${media.mobile} {
    padding: 0.5rem;
    margin-top: 0.5rem;
  }
`;

const DebugHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
  
  ${media.mobile} {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }
`;

const DebugButton = styled.button`
  font-size: 0.7rem;
  background: ${({ $primary }) => ($primary ? '#2563eb' : '#64748b')};
  color: #fff;
  border: none;
  padding: 0.35rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
  flex: 1;
  min-width: 80px;
  
  &:hover {
    background: ${({ $primary }) => ($primary ? '#1d4ed8' : '#475569')};
  }
  
  ${media.mobile} {
    padding: 0.3rem 0.5rem;
    font-size: 0.65rem;
  }
`;

const DebugContent = styled.div`
  font-size: 0.65rem;
  color: #1e40af;
  word-break: break-all;
  margin-top: 0.4rem;
  
  ${media.mobile} {
    font-size: 0.6rem;
  }
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border: 1px solid #93c5fd;
  background: #fff;
  margin-top: 0.4rem;
  border-radius: 4px;
  
  ${media.mobile} {
    max-height: 150px;
  }
`;

const ResponsiveRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 1rem;
  padding: 0 0.5rem;
  box-sizing: border-box;
  
  ${media.tablet} {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0;
    max-width: 100%;
  }
  
  ${media.mobile} {
    gap: 0.5rem;
  }
`;

const DrawerSetup = ({ onComplete, initialDimensions, dataManager }) => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const rectifierRef = useRef(null);
  
  // State management
  const [unit, setUnit] = useState('mm');
  const [baseDimensionsMM, setBaseDimensionsMM] = useState({
    width: initialDimensions?.width || '',
    length: initialDimensions?.length || '',
    height: initialDimensions?.height || ''
  });
  const [displayDims, setDisplayDims] = useState({
    width: '',
    length: '',
    height: ''
  });

  
  const [image, setImage] = useState(dataManager?.appData?.uploadedImage?.url || null);
  const [originalFile, setOriginalFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [transform, setTransform] = useState(dataManager?.appData?.uploadedImage?.transform || null);
  const [cornerDeltas, setCornerDeltas] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [underlayImage, setUnderlayImage] = useState(null);
  const [rectifiedDrawerMM, setRectifiedDrawerMM] = useState(null);
  const [rotatedImage, setRotatedImage] = useState(null);
  const [showUnderlayPreview, setShowUnderlayPreview] = useState(false);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);

  useEffect(() => {
    if (initialDimensions) {
      setDisplayDims({
        width: formatDisplayVal(initialDimensions.width),
        length: formatDisplayVal(initialDimensions.length),
        height: formatDisplayVal(initialDimensions.height)
      });
    }
  }, [initialDimensions]);

  // Memoized values
  const drawerMM = useMemo(() => {
    if (!baseDimensionsMM.width || !baseDimensionsMM.length) return { width: 0, length: 0 };
    return { 
      width: parseFloat(baseDimensionsMM.width), 
      length: parseFloat(baseDimensionsMM.length) 
    };
  }, [baseDimensionsMM.width, baseDimensionsMM.length]);

  const gridCols = useMemo(() => drawerMM.width > 0 ? (drawerMM.width / 21) : undefined, [drawerMM.width]);
  const gridRows = useMemo(() => drawerMM.length > 0 ? (drawerMM.length / 21) : undefined, [drawerMM.length]);
  const isExpanded = useMemo(() => image && baseDimensionsMM.width && baseDimensionsMM.length, [image, baseDimensionsMM]);
  const showHeaders = useMemo(() => !isExpanded, [isExpanded]);
  const isValid = useMemo(() => 
    baseDimensionsMM.width && baseDimensionsMM.length && baseDimensionsMM.height && image,
    [baseDimensionsMM, image]
  );

  // Format display values based on unit
  const formatDisplayVal = useCallback((mmVal) => {
    if (mmVal === '' || mmVal == null || isNaN(parseFloat(mmVal))) return '';
    const v = parseFloat(mmVal);
    return unit === 'mm' ? v.toFixed(1) : (v / 25.4).toFixed(1);
  }, [unit]);

  // Event handlers
  const handleInputChange = useCallback((field, val) => {
    setDisplayDims(prev => ({ ...prev, [field]: val }));
  }, []);

  const handleInputBlur = useCallback((field, val) => {
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
    
    if (dataManager && baseDimensionsMM.width && baseDimensionsMM.length && baseDimensionsMM.height) {
      dataManager.updateDrawerDimensions({
        width: parseFloat(baseDimensionsMM.width),
        length: parseFloat(baseDimensionsMM.length),
        height: parseFloat(baseDimensionsMM.height)
      });
    }
  }, [unit, dataManager, baseDimensionsMM, formatDisplayVal]);

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setRotatedImage(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const baseUrl = event.target.result;
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
    
    reader.onerror = () => {
      setUploading(false);
      console.error('Image upload failed');
    };
    
    reader.readAsDataURL(file);
  }, [dataManager]);

  const handleTransformChange = useCallback((newTransform, gridCenter) => {
    setTransform(newTransform);
    
    if (newTransform && gridCenter) {
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
  }, [dataManager, image]);

  const handleExportImage = useCallback((dataURL) => {
    setCroppedImage(dataURL);
    setUnderlayImage(dataURL);
    
    if (dataManager) {
      dataManager.updateUploadedImage({ 
        ...dataManager.appData.uploadedImage, 
        underlay: dataURL 
      });
    }
  }, [dataManager]);

  const handleRectifierComplete = useCallback(async (result) => {
    if (!result) return;
    
    try {
      const { 
        underlayImage: rectUnderlay, 
        rectifiedBlob, 
        quad_px, 
        target_size_px, 
        homography, 
        px_per_mm_after_rect, 
        metrics, 
        exif, 
        orig_size_px 
      } = result;

      setCroppedImage(rectUnderlay);
      setUnderlayImage(rectUnderlay);
      const rectifiedDims = result.drawer_mm || drawerMM; 
      setRectifiedDrawerMM(rectifiedDims);

      const rectifyMeta = {
        quad_px,
        target_size_px,
        homography,
        px_per_mm_after_rect,
        metrics,
        exif,
        orig_size_px,
        drawer_mm: rectifiedDims
      };

      if (dataManager) {
        dataManager.updateUploadedImage({
          ...dataManager.appData.uploadedImage,
          underlay: rectUnderlay,
          rectifyMeta
        });
      }
    } catch (err) {
      console.error('Rectification completion error', err);
    }
  }, [dataManager, originalFile, baseDimensionsMM, drawerMM]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    let rectifyResult = null;
    setSubmitting(true);
    if (rectifierRef.current && image && baseDimensionsMM.width && baseDimensionsMM.length) {
      try {
        rectifyResult = await rectifierRef.current.rectify();
        if (rectifyResult?.drawer_mm) {
          setRectifiedDrawerMM(rectifyResult.drawer_mm);
       }
      } catch (e) {
        console.warn('Rectification failed', e);
      }
    }
  
    const rawDimensions = {
      width: parseFloat(baseDimensionsMM.width),
      length: parseFloat(baseDimensionsMM.length),
      height: parseFloat(baseDimensionsMM.height),
      unit: 'mm'
    };
    let finalDrawerDimensions = rawDimensions;
    if (rectifiedDrawerMM && rectifiedDrawerMM.width && rectifiedDrawerMM.length) {
        finalDrawerDimensions = {
            ...rawDimensions, // Includes height and unit
            width: rectifiedDrawerMM.width,
            length: rectifiedDrawerMM.length
        };
    }
    const finalUnderlay = rectifyResult?.underlayImage || underlayImage || croppedImage || image;
  
    // Finalize and save to Supabase only here
    if (SupabaseService.isEnabled() && rectifyResult) {
      const { rectifiedBlob, quad_px, target_size_px, homography, px_per_mm_after_rect, metrics, exif, orig_size_px } = rectifyResult;
  
      const now = new Date();
      const dateFolder = now.toISOString().slice(0, 10);
      const rand = Math.random().toString(16).slice(2, 8);
      const isoStamp = new Date().toISOString().replace(/:/g, '-');
      const sampleId = `${isoStamp}_${rand}`;
      const originalKey = `raw/${dateFolder}/${rand}.jpg`;
      const rectifiedKey = `rectified/${dateFolder}/${rand}.jpg`;
  
      try {
        // Upload raw image
        if (originalFile) {
          await SupabaseService.uploadImage(originalKey, originalFile);
        }
  
        // Upload rectified image
        if (rectifiedBlob) {
          await SupabaseService.uploadImage(rectifiedKey, rectifiedBlob, 'image/jpeg');
        }
  
        // Insert record
        const quality = { user_confirmed: true, fit_error_px: 0 };
        const interaction_stats = { 
          drag_events: metrics?.drag_events || 0, 
          ms_adjusting: metrics?.ms_adjusting || 0 
        };
        const client = getClientInfo();
  
        await SupabaseService.insertRecord({
          sample_id: sampleId,
          image_original_key: originalKey,
          image_rectified_key: rectifiedKey,
          orig_size_px,
          quad_px,
          target_size_px,
          drawer_dims_mm: {
            width_mm: rawDimensions.width,
            length_mm: rawDimensions.length,
            depth_mm: rawDimensions.height
          },
          px_per_mm_after_rect: { 
            x: px_per_mm_after_rect?.x, 
            y: px_per_mm_after_rect?.y 
          },
          homography,
          quality,
          interaction_stats,
          client,
          exif
        });
  
        // Save sample ID to dataManager
        if (dataManager) {
          dataManager.updateUploadedImage({
            ...(dataManager.appData.uploadedImage || {}),
            rectifyMeta: {
              ...(dataManager.appData.uploadedImage?.rectifyMeta || {}),
              sample_id: sampleId,
              image_original_key: originalKey,
              image_rectified_key: rectifiedKey
            }
          });
        }
      } catch (e) {
        console.warn('Supabase operation failed', e);
      }
    }
  
    // Finalize navigation
    onComplete({
      drawerDimensions: finalDrawerDimensions,
      underlayImage: finalUnderlay,
      transform,
      cornerDeltas
    });
  
    navigate('/layout', { state: { underlayImage: finalUnderlay } });
    setSubmitting(false);
  }, [
    submitting,
    image, 
    baseDimensionsMM, 
    dataManager, 
    // drawerMM, 
    underlayImage, 
    croppedImage, 
    transform, 
    cornerDeltas, 
    onComplete, 
    navigate,
    originalFile,
    getClientInfo,
    rectifiedDrawerMM
  ]);

  const handleRotateImage = useCallback(() => {
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
  }, [image, rotatedImage, dataManager]);

  const handleManualPreview = useCallback(async () => {
    if (!rectifierRef.current) return;
    
    try {
      const result = await rectifierRef.current.rectify();
      
      if (result?.underlayImage) {
        setUnderlayImage(result.underlayImage);
        setCroppedImage(result.underlayImage);
        
        if (dataManager) {
          dataManager.updateUploadedImage({
            ...(dataManager.appData.uploadedImage || {}),
            underlay: result.underlayImage,
            rectifyMeta: {
              quad_px: result.quad_px,
              target_size_px: result.target_size_px,
              homography: result.homography,
              px_per_mm_after_rect: result.px_per_mm_after_rect,
              metrics: result.metrics,
              exif: result.exif,
              orig_size_px: result.orig_size_px,
              drawer_mm: { width: drawerMM.width, length: drawerMM.length }
            }
          });
        }
      } else {
        console.warn('Rectification returned no result');
      }
    } catch (e) {
      console.warn('Manual rectification failed', e);
    }
  }, [dataManager, drawerMM]);

  // Helper functions
  const getClientInfo = useCallback(() => {
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
  }, []);

  // Effects
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!dataManager?.appData?.uploadedImage?.url) {
      setImage(null);
      setTransform(null);
    }
  }, [dataManager?.appData?.uploadedImage?.url]);

  useEffect(() => {
    if (!dataManager?.appData?.drawerDimensions) {
      setBaseDimensionsMM({ width: '', length: '', height: '' });
    }
  }, [dataManager?.appData?.drawerDimensions]);

  return (
    <SetupContainer $expanded={isExpanded}>
      {showHeaders && (
        <>
          <PageTitle $visible={showHeaders}>Drawer Setup</PageTitle>
          <PageSubtitle $visible={showHeaders}>
            Upload an image of your sketch and specify the drawer dimensions to begin.
          </PageSubtitle>
        </>
      )}
      
      <Card $expanded={isExpanded}>
        <ResponsiveRow>
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
        </ResponsiveRow>

        <UnitToggle>
          <UnitButton 
            $active={unit === 'mm'} 
            onClick={() => setUnit('mm')}
          >
            Millimeters
          </UnitButton>
          <UnitButton 
            $active={unit === 'inches'} 
            onClick={() => setUnit('inches')}
          >
            Inches
          </UnitButton>
        </UnitToggle>

        <div>
          <UploadLabel>
            {uploading ? 'Uploading...' : 'Upload Image'}
            <HiddenFileInput
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </UploadLabel>
        </div>

        {image && (
          <PreviewSection>
            <SectionTitle>Align Grid with Your Drawer</SectionTitle>
            <SectionDescription>
              Adjust the grid corners to match your drawer edges. The red border indicates the crop area.
            </SectionDescription>
            
            {(!baseDimensionsMM.width || !baseDimensionsMM.length) && (
              <WarningText>
                Please enter drawer width and length to enable grid alignment.
              </WarningText>
            )}
            
            <PerspectiveGridRectifier
              ref={rectifierRef}
              imageSrc={image}
              imageFile={originalFile}
              drawerMM={drawerMM}
              gridCols={Math.round(gridCols)}
              gridRows={Math.round(gridRows)}
              pxPerMM={15}
              onComplete={handleRectifierComplete}
            />
            
            <DebugPanel>
              <DebugHeader>
                <strong>Rectification Preview</strong>
                <div>
                  <DebugButton 
                    $primary 
                    onClick={handleManualPreview}
                  >
                    Generate Preview
                  </DebugButton>
                  <DebugButton 
                    onClick={() => setShowUnderlayPreview(v => !v)}
                  >
                    {showUnderlayPreview ? 'Hide' : 'Show'}
                  </DebugButton>
                </div>
              </DebugHeader>
              
              {showUnderlayPreview && underlayImage && (
                <>
                  <DebugContent>
                    Preview generated ({underlayImage.length} bytes)
                  </DebugContent>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <PreviewImage
                      src={underlayImage}
                      alt="Rectified Preview"
                    />
                  </div>
                </>
              )}
            </DebugPanel>
          </PreviewSection>
        )}

<SubmitButton
          $expanded={isExpanded}
          onClick={handleSubmit}
          disabled={!isValid || uploading || submitting}
        >
          {submitting ? (
            <>
              <Spinner />
              Please wait...
            </>
          ) : uploading ? (
            'Processing...'
          ) : (
            'Continue to Layout'
          )}
        </SubmitButton>
      </Card>
    </SetupContainer>
  );
};

export default DrawerSetup;