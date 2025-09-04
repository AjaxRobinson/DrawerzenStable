import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import Drawer3DView from '../LayoutDesigner/components/Drawer3DView';
import SupabaseService from '../../services/SupabaseService';

const CheckoutContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
`;

const VisualizationSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  height: fit-content;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: ${props => props.columns || '1fr'};
  gap: 1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
  }
`;

const CanvasContainer = styled.div`
  height: 400px;
  background: #f9fafb;
  border-radius: 8px;
  overflow: hidden;
`;

const OrderSummary = styled.div`
  background: #f3f4f6;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: ${props => props.$total ? '#1f2937' : '#6b7280'};
  font-weight: ${props => props.$total ? '700' : '400'};
  font-size: ${props => props.$total ? '1.125rem' : '1rem'};
  padding-top: ${props => props.$total ? '1rem' : '0'};
  border-top: ${props => props.$total ? '2px solid #e5e7eb' : 'none'};
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 2rem;
  
  &:hover:not(:disabled) {
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

const ThankYouContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem;
`;

const ThankYouBox = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
`;

const ThankYouTitle = styled.h1`
  color: #10b981;
  font-size: 2.5rem;
  margin-bottom: 1rem;
  font-weight: 700;
`;

const ThankYouMessage = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  line-height: 1.6;
  margin-bottom: 0;
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  display: none; /* Hide error messages */
`;

const SuccessMessage = styled.div`
  background: #d1fae5;
  color: #065f46;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;

export default function Checkout({ orderData, layoutConfig, drawerDimensions, customerInfo, dataManager }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Use customer info from data manager
  const [formData, setFormData] = useState({
    email: customerInfo?.email || '',
    firstName: customerInfo?.firstName || '',
    lastName: customerInfo?.lastName || '',
    address: customerInfo?.address || '',
    apartment: customerInfo?.apartment || '',
    city: customerInfo?.city || '',
    state: customerInfo?.state || '',
    zipCode: customerInfo?.zipCode || '',
    country: customerInfo?.country || 'US',
    phone: customerInfo?.phone || ''
  });

  // Update form data when customer info changes
  useEffect(() => {
    if (customerInfo) {
      setFormData(prev => ({
        ...prev,
        email: customerInfo.email || prev.email,
        firstName: customerInfo.firstName || prev.firstName,
        lastName: customerInfo.lastName || prev.lastName,
        address: customerInfo.address || prev.address,
        apartment: customerInfo.apartment || prev.apartment,
        city: customerInfo.city || prev.city,
        state: customerInfo.state || prev.state,
        zipCode: customerInfo.zipCode || prev.zipCode,
        country: customerInfo.country || prev.country,
        phone: customerInfo.phone || prev.phone
      }));
    }
  }, [customerInfo]);

  // Use the final total from order data
  const finalTotal = orderData.total;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedData);
    
    // Update data manager with customer info changes
    dataManager.updateCustomerInfo({ [name]: value });
  };

  const validateForm = () => {
    const required = ['email', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];
    const missing = required.filter(field => !formData[field] || formData[field].trim() === '');
    
    if (missing.length > 0) {
      setError(`Please fill in the following required fields: ${missing.join(', ')}`);
      return false;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // First, ensure all form data is synced to dataManager
      dataManager.updateCustomerInfo(formData);
      
      // Get the current app data after updating
      const { appData } = dataManager;
      
  console.log('Submitting order with data:', {
        customerInfo: formData,
        drawerDimensions: appData.drawerDimensions,
        layoutConfig: appData.layoutConfig,
        orderData: appData.orderData,
        imageUrl: appData.uploadedImage?.url
      });
      
      // Prepare legacy sheet logging payload (do not shadow variable names)
      const sheetOrderPayload = {
        action: 'appendOrderLog',
        rowData: [
          new Date().toISOString(),
          dataManager.sessionId || 'session_' + Date.now(),
          formData.email,
          formData.firstName,
          formData.lastName,
            formData.phone || '',
          formData.address,
          formData.apartment || '',
          formData.city,
          formData.state,
          formData.zipCode,
          formData.country,
          appData.drawerDimensions?.width || '',
          appData.drawerDimensions?.length || '',
          appData.drawerDimensions?.height || '',
          appData.layoutConfig?.length || 0,
          appData.orderData?.total || 0,
          JSON.stringify(appData.layoutConfig || []),
          appData.uploadedImage?.url || '',
          'Submitted'
        ]
      };
      console.log('Sending data to Google Apps Script:', sheetOrderPayload);
      
      // Persist to Supabase orders table using new submitOrder abstraction
      if (SupabaseService.isEnabled()) {
        try {
          const rawBins = Array.isArray(appData.layoutConfig) ? appData.layoutConfig : [];
          // Build detailed list preserving each bin's true user-defined dimensions
          const binDetails = rawBins.map((b, idx) => ({
            type: b.name || `${b.width}x${b.length}x${b.height}`,
            width: b.width,
            length: b.length,
            height: b.height,
            index: idx,
            color: b.color || null
          }));
          // Aggregate count for quick summary
          const orderForSubmit = {
            bins: {
              count: rawBins.length,
              details: binDetails
            },
            drawer_dimensions_mm: appData.drawerDimensions ? {
              width: appData.drawerDimensions.width,
              length: appData.drawerDimensions.length,
              depth: appData.drawerDimensions.height
            } : null,
            pricing: (() => {
              const pricingObj = {
                subtotal: appData.orderData?.subtotal || 0,
                shipping: appData.orderData?.shipping || 0,
                total: appData.orderData?.total || 0,
                currency: 'USD'
              };
              if (appData.orderData?.baseplateCost != null) pricingObj.baseplate = appData.orderData.baseplateCost;
              if (appData.orderData?.discount) pricingObj.discount = appData.orderData.discount;
              return pricingObj;
            })(),
            shipping_address: (() => {
              const addr = {
                name: `${formData.firstName} ${formData.lastName}`.trim(),
                street: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zipCode,
                country: formData.country,
                phone: formData.phone || undefined
              };
              if (formData.apartment) addr.apartment = formData.apartment;
              return addr;
            })(),
            source_image: appData.uploadedImage?.url || null,
            status: 'pending',
            // Cost cent fields (integers) for backend indexing / analytics
            total_price_cents: (() => {
              const total = appData.orderData?.total || 0;
              return Math.round(total * 100);
            })(),
            bins_cost_cents: (() => {
              const subtotal = appData.orderData?.subtotal || 0;
              const baseplate = appData.orderData?.baseplateCost || 0;
              return Math.round((subtotal - baseplate) * 100);
            })(),
            baseplate_cost_cents: (() => {
              const baseplate = appData.orderData?.baseplateCost || 0;
              return Math.round(baseplate * 100);
            })(),
            session_id: dataManager.sessionId // allow service to generate if falsy
          };
          const submitRes = await SupabaseService.submitOrder(orderForSubmit);
          if (!submitRes.success) {
            console.warn('Supabase submitOrder failed', submitRes.error);
          } else {
            console.log('Supabase submitOrder success', submitRes.data || submitRes.note);
          }
        } catch (supaErr) {
          console.warn('Supabase submitOrder exception', supaErr);
        }
      }

      // Make direct request to Google Apps Script (legacy sheet logging)
      const response = await fetch('https://script.google.com/macros/s/AKfycbw-skmmpZkU3Pz988vPjNd7s5bX0O-1Bb5KBmmeGuMOfEGCRm_WF-Fh0lx8Ts6ioEpB/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(sheetOrderPayload)
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);
      
      if (result.success) {
        // Clear all data only on successful submission
        dataManager.clearAllData();
        
        // Show success message
        setSuccess(true);
        setIsProcessing(false);
      } else {
        throw new Error(result.error || 'Failed to submit order');
      }
      
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('There was an error submitting your order. Please try again.');
      setIsProcessing(false);
    }
  };

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  return (
    <CheckoutContainer>
      {success ? (
        <ThankYouContainer>
          <ThankYouBox>
            <ThankYouTitle>Thank You for Your Order!</ThankYouTitle>
            <ThankYouMessage>
              We've received your custom drawer configuration and will begin crafting your storage solution. 
              You'll receive an email confirmation shortly with your order details.
            </ThankYouMessage>
          </ThankYouBox>
        </ThankYouContainer>
      ) : (
        <>
          <h1>Checkout</h1>
          <p>Complete your order and we'll start crafting your custom storage solution</p>

          <CheckoutGrid>
            <FormSection>
              <h2>Shipping Information</h2>
              
              <form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your@email.com"
                    required
                  />
                </FormGroup>

                <InputRow columns="1fr 1fr">
                  <FormGroup>
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Last Name</Label>
                    <Input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                </InputRow>

                <FormGroup>
                  <Label>Address</Label>
                  <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Apartment, suite, etc. (optional)</Label>
                  <Input
                    type="text"
                    name="apartment"
                    value={formData.apartment}
                    onChange={handleInputChange}
                    placeholder="Apt 4B"
                  />
                </FormGroup>

                <InputRow columns="2fr 1fr 1fr">
                  <FormGroup>
                    <Label>City</Label>
                    <Input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>State</Label>
                    <Select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>ZIP Code</Label>
                    <Input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      pattern="[0-9]{5}"
                      required
                    />
                  </FormGroup>
                </InputRow>

                <FormGroup>
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </FormGroup>

                <SubmitButton type="submit" disabled={isProcessing}>
                  {isProcessing ? 'Submitting Order...' : 'Submit Order for Review'}
                </SubmitButton>
              </form>
            </FormSection>

            <VisualizationSection>
              <h2>Your Custom Drawer</h2>
              <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                3D preview of your configured drawer
              </p>
              
              <CanvasContainer>
                <Drawer3DView drawerDimensions={drawerDimensions} bins={orderData.bins} waveAnimation />
              </CanvasContainer>
              
              <OrderSummary>
                <h3>Order Summary</h3>
                <SummaryRow>
                  <span>Bins ({orderData.bins.length} items)</span>
                  <span>${(orderData.subtotal - (orderData.baseplateCost || 0)).toFixed(2)}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Baseplate</span>
                  <span>${(orderData.baseplateCost || 0).toFixed(2)}</span>
                </SummaryRow>
                <SummaryRow>
                  <span>Shipping</span>
                  <span>{orderData.shipping === 0 ? 'FREE' : `$${orderData.shipping.toFixed(2)}`}</span>
                </SummaryRow>
                {orderData.discount > 0 && (
                  <SummaryRow>
                    <span>Discount ({orderData.discount}%)</span>
                    <span>-${(orderData.subtotal * orderData.discount / 100).toFixed(2)}</span>
                  </SummaryRow>
                )}
                <SummaryRow $total>
                  <span>Total</span>
                  <span>${finalTotal.toFixed(2)}</span>
                </SummaryRow>
              </OrderSummary>
            </VisualizationSection>
          </CheckoutGrid>
        </>
      )}
    </CheckoutContainer>
  );
}