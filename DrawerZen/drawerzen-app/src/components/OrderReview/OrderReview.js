import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { calculateBinPrice, calculateBaseplateCost } from '../LayoutDesigner/LayoutDesigner.utils';
import { GRID_SIZE } from '../LayoutDesigner/LayoutDesigner.constants';

// Styled Components
const ReviewContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  min-height: calc(100vh - 80px); /* Minimum height, but can expand */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  @media (max-width: 768px) {
    min-height: calc(100vh - 70px);
    padding: 0.75rem;
  }
`;

const YourDrawerSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* Don't shrink */
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const DrawerInfo = styled.div`
  h3 {
    margin: 0 0 0.75rem 0;
    color: #374151;
    font-size: 1.25rem;
  }
  
  .dimensions {
    margin: 0 0 0.5rem 0;
    color: #6b7280;
    font-weight: 500;
  }
  
  .bin-count {
    margin: 0;
    color: #6b7280;
    font-weight: 500;
  }
`;

const SaveButton = styled.button`
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const OrderSummary = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  /* Remove flex: 1 and min-height constraints to allow natural expansion */
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: ${props => props.$isCollapsed ? 'none' : '1px solid #e5e7eb'};
  cursor: pointer;
  user-select: none;
  
  h2 {
    margin: 0;
    color: #374151;
  }
  
  .dropdown-arrow {
    transition: transform 0.3s ease;
    transform: ${props => props.$isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)'};
    font-size: 1.2rem;
    color: #6b7280;
  }
`;

const CollapsibleContent = styled.div`
  overflow: hidden;
  transition: max-height 0.6s ease-in-out, opacity 0.3s ease-in-out;
  max-height: ${props => props.$isCollapsed ? '0' : '2000px'}; /* Large value for expanded state */
  opacity: ${props => props.$isCollapsed ? 0 : 1};
  display: flex;
  flex-direction: column;
  
  /* Ensure content is hidden when collapsed */
  ${props => props.$isCollapsed && `
    padding: 0;
    margin: 0;
  `}
`;

const BinList = styled.div`
  padding: 0 1.5rem;
  /* Remove overflow and flex constraints to allow natural expansion */
`;

const BinItem = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  margin-bottom: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const BinPreview = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.color};
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
`;

const BinDetails = styled.div`
  h4 {
    margin: 0 0 0.25rem 0;
    color: #374151;
    font-size: 1rem;
  }
  
  p {
    margin: 0.125rem 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const BinPrice = styled.div`
  font-weight: 700;
  font-size: 1.125rem;
  color: #4f46e5;
  text-align: right;
`;

const PromoSection = styled.div`
  display: flex;
  gap: 0.5rem;
  margin: 0;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  
  input {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #4f46e5;
    }
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    
    &:hover {
      background: #4338ca;
    }
  }
`;

const TotalSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1.5rem;
  border-top: 2px solid #e5e7eb;
  background: white;
  border-radius: 0 0 12px 12px;
`;

const TotalLabel = styled.h3`
  margin: 0.5rem 0 0 0;
  font-size: 1.25rem;
  color: #374151;
`;

const TotalPrice = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #4f46e5;
`;

const ShippingInfo = styled.div`
  background: #f0f9ff;
  padding: 1rem 1.5rem;
  border-left: 4px solid #3b82f6;
  
  h4 {
    margin: 0 0 0.75rem 0;
    color: #1e40af;
    font-size: 0.9rem;
  }
  
  p {
    margin: 0.125rem 0;
    color: #1e3a8a;
    font-size: 0.8rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 1rem;
  /* Remove flex-shrink: 0 to allow natural page expansion */
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const PrimaryButton = styled.button`
  padding: 1rem 2rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4338ca;
    transform: translateY(-1px);
  }
`;

const SecondaryButton = styled.button`
  padding: 1rem 2rem;
  background: white;
  color: #4f46e5;
  border: 2px solid #4f46e5;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #4f46e5;
    color: white;
    transform: translateY(-1px);
  }
`;

export default function OrderReview({ bins = {}, drawerDimensions, onProceedToCheckout, dataManager }) {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed

  // Extract bins array from the layout config or from data manager
  const placedBins = bins.bins || bins || dataManager?.appData?.layoutConfig || [];

  // Use server-side data if available, otherwise fallback to props
  const serverData = dataManager?.appData;
  const actualDrawerDimensions = serverData?.drawerDimensions || drawerDimensions;
  const layoutData = serverData?.layoutConfig || placedBins;
  
  // Ensure actualPlacedBins is always an array
  const actualPlacedBins = Array.isArray(layoutData) ? layoutData : 
                          (layoutData && Array.isArray(layoutData.bins)) ? layoutData.bins :
                          [];

  // Convert dimensions to cells
  const drawerCellsX = Math.ceil(actualDrawerDimensions.width / GRID_SIZE);
  const drawerCellsY = Math.ceil(actualDrawerDimensions.length / GRID_SIZE);

  const calculateSubtotal = () => {
    // Ensure actualPlacedBins is an array before calling reduce
    if (!Array.isArray(actualPlacedBins)) {
      console.warn('actualPlacedBins is not an array:', actualPlacedBins);
      return 0;
    }
    
    const binsTotal = actualPlacedBins.reduce((total, bin) => total + calculateBinPrice(bin), 0);
    const baseplateTotal = calculateBaseplateCost(actualDrawerDimensions);
    return binsTotal + baseplateTotal;
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal > 100 ? 0 : 15;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping();
    const discountAmount = subtotal * (discount / 100);
    return subtotal + shipping - discountAmount;
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    if (code === 'SAVE10') {
      setDiscount(10);
      alert('Promo code applied! 10% discount');
    } else if (code === 'FIRST20') {
      setDiscount(20);
      alert('Promo code applied! 20% discount');
    } else {
      alert('Invalid promo code');
    }
  };

  const handleCheckout = () => {
    const orderData = {
      bins: actualPlacedBins,
      drawerDimensions: actualDrawerDimensions,
      subtotal: calculateSubtotal(),
      shipping: calculateShipping(),
      discount,
      total: calculateTotal(),
      baseplateCost: calculateBaseplateCost(actualDrawerDimensions)
    };
    
    // Update data manager with order data
    if (dataManager) {
      dataManager.updateOrderData(orderData);
    }
    
    onProceedToCheckout(orderData);
    navigate('/checkout');
  };

  const handleBack = () => {
    navigate('/layout');
  };

  const handleSaveDrawer = () => {
    const drawerData = {
      dimensions: drawerDimensions,
      bins: placedBins,
      cellDimensions: {
        x: drawerCellsX,
        y: drawerCellsY
      },
      savedDate: new Date().toISOString()
    };
    
    // Simulate saving to user account (will be replaced with real API call)
    console.log('Saving drawer to user account:', drawerData);
    alert('Drawer saved to your cabinet! (This is simulated - account functionality will be built later)');
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <ReviewContainer>
      <YourDrawerSection>
        <DrawerInfo>
          <h3>Your Drawer</h3>
          <p className="dimensions">
            {drawerCellsX} × {drawerCellsY} cells ({Math.round(actualDrawerDimensions.width)}mm × {Math.round(actualDrawerDimensions.length)}mm)
          </p>
          <p className="bin-count">
            {actualPlacedBins.length} bin{actualPlacedBins.length !== 1 ? 's' : ''} configured
          </p>
        </DrawerInfo>
        <SaveButton onClick={handleSaveDrawer}>
          Save drawer to my cabinet
        </SaveButton>
      </YourDrawerSection>

      <OrderSummary>
  <OrderHeader $isCollapsed={isCollapsed} onClick={toggleCollapse}>
          <h2>Order Details</h2>
          <span className="dropdown-arrow">▼</span>
        </OrderHeader>
        
  <CollapsibleContent $isCollapsed={isCollapsed}>
          <BinList>
            {actualPlacedBins.length > 0 ? actualPlacedBins.map((bin, index) => (
              <BinItem key={bin.id || index}>
                <BinPreview color={bin.color || '#4f46e5'}>
                  {index + 1}
                </BinPreview>
                
                <BinDetails>
                  <h4>{bin.name || `Custom Bin ${index + 1}`}</h4>
                  <p>
                    {bin.width}mm × {bin.length}mm × {bin.height}mm
                  </p>
                  <p>Position: ({Math.round(bin.x)}mm, {Math.round(bin.y)}mm)</p>
                  {bin.shadowBoard && <p>• Shadow Board included</p>}
                </BinDetails>
                
                <BinPrice>${calculateBinPrice(bin).toFixed(2)}</BinPrice>
              </BinItem>
            )) : (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                No bins in your layout. Please go back and add some bins.
              </p>
            )}
          </BinList>
        </CollapsibleContent>

        <PromoSection>
          <input
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button onClick={applyPromoCode}>Apply</button>
        </PromoSection>

        <ShippingInfo>
          <h4>Shipping Information</h4>
          <p>• Production: 3-5 days • Shipping: 2-4 days</p>
          <p>• Free shipping on orders over $100</p>
          <p>• All bins are custom made to order</p>
        </ShippingInfo>

        <TotalSection>
          <div>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Bins: ${Array.isArray(actualPlacedBins) ? 
                actualPlacedBins.reduce((total, bin) => total + calculateBinPrice(bin), 0).toFixed(2) : 
                '0.00'}
            </p>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Baseplate: ${calculateBaseplateCost(actualDrawerDimensions).toFixed(2)}
            </p>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Subtotal: ${calculateSubtotal().toFixed(2)}
            </p>
            <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
              Shipping: {calculateShipping() === 0 ? 'FREE' : `$${calculateShipping().toFixed(2)}`}
            </p>
            {discount > 0 && (
              <p style={{ color: '#10b981', marginBottom: '0.5rem' }}>
                Discount ({discount}%): -${(calculateSubtotal() * discount / 100).toFixed(2)}
              </p>
            )}
            <TotalLabel>Total</TotalLabel>
          </div>
          <TotalPrice>${calculateTotal().toFixed(2)}</TotalPrice>
        </TotalSection>
      </OrderSummary>

      <ActionButtons>
        <SecondaryButton onClick={handleBack}>
          Back to Layout
        </SecondaryButton>
        <PrimaryButton onClick={handleCheckout} disabled={actualPlacedBins.length === 0}>
          Proceed to Checkout
        </PrimaryButton>
      </ActionButtons>
    </ReviewContainer>
  );
}
