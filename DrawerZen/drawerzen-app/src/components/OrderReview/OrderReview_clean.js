import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

// Styled Components
const ReviewContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const DrawerInfo = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #374151;
  }
  
  p {
    margin: 0;
    color: #6b7280;
    font-weight: 500;
  }
`;

const OrderSummary = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
`;

const BinList = styled.div`
  border-top: 1px solid #e5e7eb;
  margin-top: 2rem;
  padding-top: 2rem;
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
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 8px;
  
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
  padding: 1.5rem 0;
  border-top: 2px solid #e5e7eb;
  margin-top: 1rem;
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
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
  margin-top: 2rem;
  
  h4 {
    margin: 0 0 1rem 0;
    color: #1e40af;
  }
  
  p {
    margin: 0.25rem 0;
    color: #1e3a8a;
    font-size: 0.875rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  
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

// Unified pricing function (matching LayoutDesigner)
function calculateBinPrice(bin) {
  if (!bin || !bin.width || !bin.length) return 0;
  
  const cellsX = Math.ceil(bin.width / 21);
  const cellsY = Math.ceil(bin.length / 21);
  const numCells = cellsX * cellsY;
  
  let pricePerCell = 0.05;
  
  if (bin.height > 21) {
    const extraHeight = bin.height - 21;
    const heightMultiplier = 1 + (extraHeight / 21) * 0.5;
    pricePerCell *= heightMultiplier;
  }
  
  let shadowBoardCost = 0;
  if (bin.shadowBoard) {
    shadowBoardCost = 3.00;
  }
  
  return Math.round((numCells * pricePerCell + shadowBoardCost) * 100) / 100;
}

export default function OrderReview({ bins = {}, drawerDimensions, onProceedToCheckout }) {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Extract bins array from the layout config
  const placedBins = bins.bins || [];

  const calculateSubtotal = () => {
    return placedBins.reduce((total, bin) => total + calculateBinPrice(bin), 0);
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
      bins: placedBins,
      drawerDimensions,
      subtotal: calculateSubtotal(),
      shipping: calculateShipping(),
      discount,
      total: calculateTotal()
    };
    
    onProceedToCheckout(orderData);
    navigate('/checkout');
  };

  const handleBack = () => {
    navigate('/layout');
  };

  return (
    <ReviewContainer>
      <h1>Review Your Order</h1>
      <p>Please review your custom storage solution before checkout</p>

      <DrawerInfo>
        <h3>Drawer Dimensions</h3>
        <p>
          {Math.round(drawerDimensions.width)}mm × 
          {Math.round(drawerDimensions.length)}mm × 
          {Math.round(drawerDimensions.height)}mm
        </p>
      </DrawerInfo>

      <OrderSummary>
        <h2>Order Details</h2>
        
        <BinList>
          {placedBins.length > 0 ? placedBins.map((bin, index) => (
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

        <PromoSection>
          <input
            type="text"
            placeholder="Enter promo code"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
          />
          <button onClick={applyPromoCode}>Apply</button>
        </PromoSection>

        <TotalSection>
          <div>
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

        <ShippingInfo>
          <h4>Shipping Information</h4>
          <p>• Estimated production time: 3-5 business days</p>
          <p>• Shipping time: 2-4 business days</p>
          <p>• Free shipping on orders over $100</p>
          <p>• All bins are custom made to order</p>
        </ShippingInfo>
      </OrderSummary>

      <ActionButtons>
        <SecondaryButton onClick={handleBack}>
          Back to Layout
        </SecondaryButton>
        <PrimaryButton onClick={handleCheckout} disabled={placedBins.length === 0}>
          Proceed to Checkout
        </PrimaryButton>
      </ActionButtons>
    </ReviewContainer>
  );
}
