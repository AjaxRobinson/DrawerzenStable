// LayoutDesigner.styles.js
import styled from 'styled-components';


const breakpoints = {
  small: '480px', // Mobile
  medium: '768px', // Tablet
  large: '1024px' // Desktop
};

export const media = {
  small: `@media (max-width: ${breakpoints.small})`,
  medium: `@media (max-width: ${breakpoints.medium})`,
  large: `@media (max-width: ${breakpoints.large})`
};

// --- Main Container ---
export const DesignerContainer = styled.div`
  width: 100%;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  margin: 0;
  box-sizing: border-box;
  overflow-y: auto;

  * {
    box-sizing: border-box;
  }

  ${media.medium} {
    height: calc(100vh - 70px);
    padding: 0.75rem;
    gap: 0.75rem;
  }

  ${media.small} {
    padding: 0.5rem;
    gap: 0.5rem;
    height: calc(100vh - 60px);
  }
`;

// --- Bin Carousel ---
export const BinCarousel = styled.div`
  background: white;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  flex-shrink: 0;
  /* Adjust height calculation for different screens */
  height: calc(12vh - 20px);
  width: 100%;
  border: ${props =>
    props.isCarouselDropTarget ? '2px dashed #4f46e5' : '2px solid transparent'};
  background: ${props => (props.isCarouselDropTarget ? '#f0f9ff' : 'white')};
  transition: all 0.3s ease;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;

  /* Dynamic pattern when ready for drop */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props =>
      props.isCarouselDropTarget
        ? 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(79, 70, 229, 0.1) 10px, rgba(79, 70, 229, 0.1) 20px)'
        : 'none'};
    border-radius: 12px;
    pointer-events: none;
    opacity: ${props => (props.isCarouselDropTarget ? 1 : 0)};
    transition: opacity 0.3s ease;
    animation: ${props =>
      props.isCarouselDropTarget ? 'movePattern 2s linear infinite' : 'none'};
  }

  @keyframes movePattern {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 28px 28px;
    }
  }

  ${media.medium} {
    padding: 0;
    height: calc(10vh - 15px);
  }

  ${media.small} {
    height: calc(9vh - 12px); /* Further adjust for small screens */

    /* Enhance drop target feedback on small screens */
    border: ${props =>
      props.isCarouselDropTarget ? '3px dashed #4f46e5' : '2px solid transparent'};
    &::before {
      background: ${props =>
        props.isCarouselDropTarget
          ? 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(79, 70, 229, 0.15) 8px, rgba(79, 70, 229, 0.15) 16px)'
          : 'none'};
    }
  }

  h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.9rem;
    transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
    position: relative;
    z-index: 1;

    ${media.medium} {
      font-size: 0.8rem;
      margin: 0 0 0.4rem 0;
    }

    ${media.small} {
      font-size: 0.75rem;
      margin: 0 0 0.3rem 0;
    }
  }
`;

export const CarouselContent = styled.div`
  display: flex;
  gap: 0.75rem;
  min-width: min-content;
  /* Adjust padding */
  padding: 0 1rem 0.5rem 1rem;
  justify-content: center; /* Always center */
  align-items: center;
  flex: 1;
  overflow: hidden;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;

  ${media.medium} {
    padding: 0 0.75rem 0.4rem 0.75rem;
    gap: 0.6rem;
  }

  ${media.small} {
    padding: 0 0.5rem 0.3rem 0.5rem;
    gap: 0.5rem;
  }

  p {
    transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
    max-height: ${props => (props.hasBins ? '0' : '2rem')};
    opacity: ${props => (props.hasBins ? 0 : 1)};
    overflow: hidden;
    font-size: 0.8rem; /* Adjust empty state text size */

    ${media.small} {
      font-size: 0.7rem;
    }
  }
`;

export const CarouselHeader = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  transition: opacity 0.6s ease-in-out, max-height 0.6s ease-in-out;
  position: relative;
  z-index: 1;
  max-height: ${props => (props.hasBins ? '0' : '2rem')};
  opacity: ${props => (props.hasBins ? 0 : 1)};
  overflow: hidden;
  /* Adjust padding */
  padding: 0.5rem 1rem 0 1rem;

  ${media.medium} {
    font-size: 0.8rem;
    margin: 0 0 0.4rem 0;
    padding: 0.4rem 0.75rem 0 0.75rem;
  }

  ${media.small} {
    font-size: 0.75rem;
    margin: 0 0 0.3rem 0;
    padding: 0.3rem 0.5rem 0 0.5rem;
  }
`;

// --- Drawer/Grid Container ---
export const DrawerContainer = styled.div`
  background: white;
  /* Adjust padding */
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;

  ${media.medium} {
    padding: 0.75rem;
  }

  ${media.small} {
    padding: 0.5rem;
  }
`;

export const GridSection = styled.div`
  display: flex;
  flex-direction: column;
  overflow: visible;
  min-width: 0;
  position: relative;
  align-items: center;
  width: 100%; /* Ensure it takes full width */
`;

export const GridAndPanelContainer = styled.div`
  display: flex;
  position: relative;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  height: auto;
  max-width: 100%;
  overflow: visible;
`;

export const GridContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  overflow: visible;
  flex: 1;
  height: auto;
  width: 100%; 
`;

// --- Action Buttons ---
export const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-shrink: 0;
  width: 100%;
  position: static;
  left: auto;
  top: auto;
  z-index: 20;

  ${media.medium} {
    gap: 0.6rem;
  }

  ${media.small} {
    gap: 0.5rem;
  }
`;

// --- Grid Wrapper and Bounding Box ---
export const GridWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  // padding: 1rem;
  background: #f8fafc;
  // border-radius: 8px;
 width: ${props => props.width ? `${props.width}px` : '100%'};
  height: ${props => props.height ? `${props.height}px` : '100%'};
  max-width: 100%;
  max-height: 100%;
  overflow: visible;
  position: relative;
  // box-sizing: border-box;

  ${media.medium} {
    padding: 0.75rem;
  }

  ${media.small} {
    padding: 0.5rem;
  }
`;

export const GridBoundingBox = styled.div`
width: ${props => props.width ? `${props.width}px` : '100%'};
  height: ${props => props.height ? `${props.height}px` : '100%'};
  position: relative;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  background: #ffffff;
  overflow: hidden;
  box-sizing: border-box;
  /* Ensure it can shrink if needed on small screens */
  max-width: 100%;
  max-height: 100%;
`;

// --- Grid and Cells ---
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.$cols}, ${props => props.$cellSize}px);
  grid-template-rows: repeat(${props => props.$rows}, ${props => props.$cellSize}px);
  gap: 0px;
  background: rgba(226, 232, 240, 0.1);
  padding: 0px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-top: 1px solid rgba(226, 232, 240, 0.3);
  border-left: 1px solid rgba(226, 232, 240, 0.3);
  box-sizing: border-box;

  canvas {
    width: 100% !important;
    height: 100% !important;
    min-width: unset !important;
  }
`;

export const GridCell = styled.div`
  background: rgba(248, 250, 252, 0.1);
  /* Cell size is controlled by Grid component props */
  position: relative;
  pointer-events: none;
  box-sizing: border-box;
  border-right: 1px solid rgba(226, 232, 240, 0.3);
  border-bottom: 1px solid rgba(226, 232, 240, 0.3);
  border-top: ${props =>
    props.$hasTopEmphasis ? '2px solid rgba(148, 163, 184, 0.7)' : 'none'};
  border-left: ${props =>
    props.$hasLeftEmphasis ? '2px solid rgba(148, 163, 184, 0.7)' : 'none'};

  &:hover {
    background: rgba(241, 245, 249, 0.2);
  }
`;

// --- Placed Bins ---
export const PlacedBin = styled.div`
  position: absolute;
  background: ${props => props.$color || '#3b82f6'};
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  /* Adjust font size for responsiveness */
  font-size: 0.7rem;
  cursor: ${props => (props.$isDragging ? 'grabbing' : 'grab')};
  transition: all 0.2s;
  z-index: 15;
  /* Adjust border thickness */
  border: 1.5px solid ${props => {
    const color = props.$color || '#3b82f6';
    const hex = color.replace('#', '');
    // Simple darkening
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - 30);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - 30);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - 30);
    return `rgb(${r}, ${g}, ${b})`;
  }};
  opacity: ${props => (props.$isDragging ? 0.6 : 1)};
  transform: ${props => (props.$isDragging ? 'scale(1.05)' : 'scale(1)')};
  pointer-events: auto;
  min-width: 20px; /* Minimum touch target size */
  min-height: 20px; /* Minimum touch target size */

  &:hover {
    transform: ${props =>
      props.$isDragging ? 'scale(1.05)' : 'scale(1.02)'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  ${props =>
    props.$selected &&
    `
    border-color: #fbbf24;
    box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 0 0 2px #fbbf24;
  `}

  /* Adjust font size on small screens */
  ${media.small} {
    font-size: 0.6rem;
    min-width: 20px; /* Ensure minimum size on small screens */
    min-height: 20px;
  }
`;

// --- Buttons ---
export const PrimaryButton = styled.button`
  padding: 0.6rem 0.9rem; /* Slightly reduced padding */
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  /* Adjust font size */
  font-size: 0.8rem;
  min-height: 44px; /* Ensure adequate touch target */

  &:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }

  ${media.medium} {
    padding: 0.5rem 0.7rem;
    font-size: 0.75rem;
  }

  ${media.small} {
    padding: 0.45rem 0.6rem; /* Further reduced for small screens */
    font-size: 0.7rem;
    border-radius: 6px; /* Slightly smaller radius */
    min-height: 44px; /* Maintain touch target */
  }
`;

export const SecondaryButton = styled.button`
  padding: 0.6rem 0.9rem;
  background: white;
  color: #4f46e5;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  min-width: 0;
  width: 100%;
  font-size: 0.8rem;
  min-height: 44px; /* Ensure adequate touch target */

  &:hover {
    background: #4f46e5;
    color: white;
    transform: translateY(-1px);
  }

  ${media.medium} {
    padding: 0.5rem 0.7rem;
    font-size: 0.75rem;
  }

  ${media.small} {
    padding: 0.45rem 0.6rem;
    font-size: 0.7rem;
    border-radius: 6px;
    min-height: 44px; /* Maintain touch target */
  }
`;

// --- Drawing and Drop Shadows ---
export const DrawingPreview = styled.div`
  position: absolute;
  /* Adjust border thickness */
  border: 1.5px dashed #4f46e5;
  background: rgba(79, 70, 229, 0.1);
  pointer-events: none;
  z-index: 8;
  border-radius: 2px;

  ${props =>
    props.$error &&
    `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  `}
`;

export const DrawingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  cursor: crosshair;
  pointer-events: auto;
`;

export const DropShadow = styled.div`
  position: absolute;
  /* Adjust border thickness */
  border: 1.5px dashed #10b981;
  background: rgba(16, 185, 129, 0.15);
  pointer-events: none;
  z-index: 10;
  border-radius: 4px;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 0.2s ease;

  ${props =>
    props.$error &&
    `
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.15);
  `}
`;

// --- Notifications ---
export const ErrorNotification = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fee2e2;
  color: #dc2626;
  /* Adjust padding */
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  border: 1px solid #fecaca;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  animation: centerFadeIn 0.3s ease-out;
  font-size: 0.9rem; /* Adjust font size */

  ${media.small} {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  @keyframes centerFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
`;

export const CenterErrorMessage = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fef3c7;
  color: #92400e;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  border: 1px solid #fde68a;
  z-index: 1000;
  font-weight: 500;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  animation: centerFadeIn 0.3s ease-out, centerFadeOut 0.3s ease-out 2.7s forwards;
  font-size: 0.9rem;

  ${media.small} {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  @keyframes centerFadeIn {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes centerFadeOut {
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.9);
    }
  }
`;

// --- Instruction Text ---
export const InstructionText = styled.p`
  text-align: center;
  /* Adjust margins */
  margin: 0.25rem 0 0 0;
  color: #6b7280;
  /* Adjust font size */
  font-size: 0.65rem;
  max-width: 100%;
  word-wrap: break-word;
  /* Adjust padding */
  padding: 0 0.5rem;
  line-height: 1.2; /* Slightly increase line height */
  /* Allow it to grow/shrink */
  height: auto;
  min-height: 1.2rem;
  overflow: hidden;

  ${media.small} {
    font-size: 0.6rem;
    padding: 0 0.3rem;
    line-height: 1.1;
    min-height: 1.1rem;
    margin: 0.2rem 0 0 0;
  }
`;

// --- Main Layout Columns ---
export const LayoutMainColumns = styled.div`
  display: grid;
  /* Refined column template for larger screens */
  grid-template-columns: minmax(140px, 18%) 1fr minmax(280px, 28%);
  gap: 1rem;
  width: 100%;
  flex: 1;
  overflow: auto;
  align-items: start;
  position: relative;
  height: 100dvh;

  ${media.large} {
    grid-template-columns: minmax(130px, 16%) 1fr minmax(270px, 30%);
    gap: 0.9rem;
  }

  ${media.medium} {
    /* Switch to a more balanced layout on tablet */
    grid-template-columns: minmax(120px, 15%) 1fr minmax(250px, 32%);
    gap: 0.8rem;
  }

  ${media.small} {
    /* Stack columns vertically on mobile */
    grid-template-columns: 1fr;
    grid-auto-rows: max-content min-content auto min-content max-content; /* Define row behavior */
    height: 100dvh;
    overflow: auto;
    gap: 0.7rem;
  }
`;

export const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: sticky; /* Keep action buttons accessible */
  top: 0.5rem;
  align-self: start;
  height: fit-content; /* Adjust height dynamically */

  ${media.small} {
    position: static; /* Remove sticky on mobile */
    order: 4; /* Move action buttons to the bottom on mobile */
    gap: 0.5rem;
    /* Make buttons horizontal on mobile if needed */
    /* flex-direction: row;
    flex-wrap: wrap;
    justify-content: center; */
  }
`;

export const CenterColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  height: 100%;

  ${media.small} {
    order: 1; /* Grid comes first on mobile */
    gap: 0.5rem;
  }
`;

export const RightColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem; /* Adjust gap */
  min-width: 0;
  height: 100%;

  ${media.small} {
    order: 3; /* Bin options and 3D view below grid on mobile */
    gap: 0.6rem;
    /* IMPORTANT: REMOVED the rule that hides BinOptionsAccordion */
    /* The accordion will now stack below the 3D view */
  }
`;

// --- Review Button ---
export const ReviewButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  /* Adjust padding */
  padding: 0.7rem 0 1rem;

  ${media.small} {
    padding: 0.5rem 0 0.8rem;
    order: 5; /* Ensure it's at the very bottom */
  }
`;

export const ReviewButton = styled(PrimaryButton)`
  width: 70%;
  font-size: 0.85rem; /* Adjust font size */

  ${media.small} {
    width: 85%; /* Make it wider on mobile */
    font-size: 0.8rem;
    padding: 0.5rem 0.7rem;
    min-height: 44px; /* Ensure touch target */
  }
`;

// --- 3D View ---
export const Drawer3DWrapper = styled.div`
  flex: 0 0 auto;
  /* Adjust height */
  height: 30%;
  min-height: 160px; /* Adjusted min height */
  position: relative;

  ${media.small} {
    min-height: 140px; /* Smaller on mobile */
    height: 25%; /* Adjust height percentage */
    order: 2; /* 3D view comes second on mobile */
  }
`;

// --- Bin Options Accordion (Improved for Mobile) ---
export const BinOptionsAccordion = styled.div`
  flex: 1 1 auto;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden; /* Allow scrolling if content is large */
  display: flex;
  flex-direction: column;
  transition: opacity 0.35s ease, transform 0.3s ease; /* Added transform */
  opacity: ${props => (props.$open ? 1 : 0)};
  pointer-events: ${props => (props.$open ? 'auto' : 'none')};
  /* Slide in/out effect */
  transform: ${props => (props.$open ? 'translateY(0)' : 'translateY(10px)')};
  /* Add internal padding for content */
  padding: 1rem;

  ${media.medium} {
    padding: 0.8rem; /* Adjust padding */
    border-radius: 10px;
  }

  ${media.small} {
    /* Ensure it's visible and styled for mobile */
    /* Removed display: none */
    padding: 0.7rem;
    border-radius: 8px;
    order: 3; /* Explicitly set order if needed (inherits from parent) */
    /* Optional: Add a max-height and internal scroll if content is very long */
    /* max-height: 30vh;
    overflow-y: auto; */
  }
`;
