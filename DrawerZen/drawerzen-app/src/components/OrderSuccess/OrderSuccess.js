import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const SuccessContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  color: white;
  font-size: 2rem;
`;

const SuccessTitle = styled.h1`
  color: #374151;
  margin-bottom: 1rem;
  font-size: 2.5rem;
`;

const SuccessMessage = styled.p`
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const InfoCard = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin: 2rem 0;
  text-align: left;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const Label = styled.span`
  font-weight: 600;
  color: #374151;
`;

const Value = styled.span`
  color: #6b7280;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${props => props.primary ? `
    background: #4f46e5;
    color: white;
    
    &:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }
  ` : `
    background: white;
    color: #4f46e5;
    border: 2px solid #4f46e5;
    
    &:hover {
      background: #ede9fe;
    }
  `}
`;

export default function OrderSuccess() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  
  useEffect(() => {
    // Get session ID from URL params or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('session');
    
    if (urlSessionId) {
      setSessionId(urlSessionId);
    } else {
      // Try to get from localStorage
      const sessionData = localStorage.getItem('drawerzen_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        setSessionId(parsed.sessionId);
      }
    }
  }, []);

  const handleNewOrder = () => {
    // Clear session and start fresh
    localStorage.removeItem('drawerzen_session');
    navigate('/');
  };

  const handleViewOrders = () => {
    // In a real app, this would redirect to an orders page
    alert('Order tracking feature coming soon!');
  };

  return (
    <SuccessContainer>
      <SuccessIcon>✓</SuccessIcon>
      
      <SuccessTitle>Order Submitted Successfully!</SuccessTitle>
      
      <SuccessMessage>
        Thank you for your order! We've received your custom drawer specifications 
        and will begin processing your order shortly. You'll receive a confirmation 
        email with detailed information and tracking updates.
      </SuccessMessage>

      <InfoCard>
        <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#374151' }}>
          Order Information
        </h3>
        
        <InfoRow>
          <Label>Session ID:</Label>
          <Value>{sessionId || 'Processing...'}</Value>
        </InfoRow>
        
        <InfoRow>
          <Label>Status:</Label>
          <Value>Order Received</Value>
        </InfoRow>
        
        <InfoRow>
          <Label>Estimated Production Time:</Label>
          <Value>3-5 business days</Value>
        </InfoRow>
        
        <InfoRow>
          <Label>Estimated Shipping:</Label>
          <Value>2-4 business days</Value>
        </InfoRow>
        
        <InfoRow>
          <Label>Next Steps:</Label>
          <Value>
            Our team will review your specifications and contact you within 24 hours 
            with any questions or to confirm production details.
          </Value>
        </InfoRow>
      </InfoCard>

      <ButtonGroup>
        <Button onClick={handleNewOrder}>
          Create Another Drawer
        </Button>
        <Button primary onClick={handleViewOrders}>
          Track My Orders
        </Button>
      </ButtonGroup>
    </SuccessContainer>
  );
}
