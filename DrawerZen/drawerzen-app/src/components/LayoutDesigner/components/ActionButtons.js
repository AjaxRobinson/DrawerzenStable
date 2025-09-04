import React from 'react';
import { 
  PrimaryButton, 
  SecondaryButton, 
  ActionButtonsContainer 
} from '../LayoutDesigner.styles';

const ActionButtons = ({ 
  onGenerateBins, 
  onReset, 
  onReview, 
  onUndo, 
  hasPlacedBins 
}) => {
  return (
    <ActionButtonsContainer>
      <PrimaryButton onClick={onGenerateBins}>
        Fill Empty Bin Space
      </PrimaryButton>
      <PrimaryButton onClick={onUndo} disabled={!hasPlacedBins}>
        Undo
      </PrimaryButton>
      <SecondaryButton onClick={onReset} disabled={!hasPlacedBins}>
        Reset
      </SecondaryButton>
    </ActionButtonsContainer>
  );
};

export default ActionButtons;
