import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Component imports
import Header from './components/Header/Header';
import DrawerSetup from './components/DrawerSetup/DrawerSetup';
import LayoutDesigner from './components/LayoutDesigner/LayoutDesigner';
import OrderReview from './components/OrderReview/OrderReview';
import Checkout from './components/Checkout/Checkout';
import OrderSuccess from './components/OrderSuccess/OrderSuccess';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.js';

// Hooks
import { useDataManagement } from './hooks/useDataManagement'; 

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Inter', sans-serif;
`;

const MainContent = styled.main`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  
  /* Remove padding for layout page to allow full viewport usage */
  &.layout-page {
    padding: 0;
    max-width: none;
    margin: 0;
  }
  
  @media (max-width: 768px) {
    padding: 1rem;
    
    &.layout-page {
      padding: 0;
    }
  }
`;

function App() {
  // Use centralized data management
  const dataManager = useDataManagement();

  // Default available bins
  const defaultBins = [
    { id: 1, label: 'Small Square', width: 42, length: 42, color: '#3b82f6' },
    { id: 2, label: 'Small Rectangle', width: 63, length: 42, color: '#10b981' },
    { id: 3, label: 'Medium Square', width: 63, length: 63, color: '#f59e0b' },
    { id: 4, label: 'Medium Rectangle', width: 84, length: 42, color: '#ef4444' },
    { id: 5, label: 'Large Square', width: 84, length: 84, color: '#8b5cf6' },
    { id: 6, label: 'Large Rectangle', width: 105, length: 63, color: '#ec4899' },
    { id: 7, label: 'Wide Rectangle', width: 126, length: 42, color: '#14b8a6' },
    { id: 8, label: 'Extra Large', width: 105, length: 84, color: '#f97316' },
  ];

  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <AppContainer>
          <Header />
          <AppContent 
            dataManager={dataManager}
            defaultBins={defaultBins}
          />
        </AppContainer>
      </Router>
    </DndProvider>
  );
}

function AppContent({ dataManager, defaultBins }) {
  const location = useLocation();
  const isLayoutPage = location.pathname === '/layout';
  const { appData, updateDrawerDimensions, updateLayoutConfig, updateOrderData, updateUploadedImage } = dataManager;
  const navUnderlay = location.state?.underlayImage;

  return (
    <MainContent className={isLayoutPage ? 'layout-page' : ''}>
      <ErrorBoundary>
        <Routes>
          {/* Step 1: Drawer Dimensions */}
          <Route path="/" element={
            <DrawerSetup 
              onComplete={(data) => {
                // Persist drawer dimensions
                if (data?.drawerDimensions) {
                  updateDrawerDimensions(data.drawerDimensions);
                }
                // Persist rectified underlay if provided (ensures availability after navigation/state loss)
                if (data?.underlayImage) {
                  updateUploadedImage({ underlay: data.underlayImage });
                }
              }}
              initialDimensions={appData.drawerDimensions}
              dataManager={dataManager}
            />
          } />

          {/* Step 2: Layout Design */}
      <Route path="/layout" element={
            appData.drawerDimensions ? (() => {
              const resolvedUnderlay = navUnderlay || appData.uploadedImage?.underlay || appData.uploadedImage?.url;
              // console.log('[App] Rendering /layout with underlay resolution', {
              //   hasNavState: !!navUnderlay,
              //   hasStoredUnderlay: !!appData.uploadedImage?.underlay,
              //   hasOriginalUrl: !!appData.uploadedImage?.url,
              //   chosenLength: resolvedUnderlay?.length,
              //   chosenPrefix: resolvedUnderlay?.slice(0,64)
              // });
              return (
                <LayoutDesigner 
                  drawerDimensions={appData.drawerDimensions}
                  availableBins={[]}
                  onLayoutComplete={(layout) => {
                    updateLayoutConfig(layout?.bins || layout);
                  }}
                  initialLayout={appData.layoutConfig}
                  dataManager={dataManager}
                  underlayImage={resolvedUnderlay}
                />
              );
            })() : (
              <Navigate to="/" />
            )
          } />

          {/* Step 3: Order Review */}
          <Route path="/review" element={
            appData.layoutConfig ? (
              <OrderReview 
                bins={appData.layoutConfig}
                drawerDimensions={appData.drawerDimensions}
                onProceedToCheckout={(order) => {
                  updateOrderData(order);
                }}
                dataManager={dataManager}
              />
            ) : (
              <Navigate to="/layout" />
            )
          } />

          {/* Step 4: Checkout */}
          <Route path="/checkout" element={
            appData.orderData ? (
              <Checkout 
                orderData={appData.orderData}
                layoutConfig={appData.layoutConfig}
                drawerDimensions={appData.drawerDimensions}
                customerInfo={appData.customerInfo}
                dataManager={dataManager}
              />
            ) : (
              <Navigate to="/review" />
            )
          } />

          {/* Order Success Page */}
          <Route path="/order-success" element={<OrderSuccess />} />
          
          {/* Catch-all route - redirect any unrecognized paths to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </MainContent>
  );
}

export default App;