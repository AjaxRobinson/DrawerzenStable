import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Component imports
import Header from './components/Header/Header';
import DrawerSetup from './components/DrawerSetup/DrawerSetup';
import LayoutDesigner from './components/LayoutDesigner/LayoutDesigner';
import OrderReview from './components/OrderReview/OrderReview';
import Login from './components/Login/Login'
import Checkout from './components/Checkout/Checkout';
import OrderSuccess from './components/OrderSuccess/OrderSuccess';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.js';
import SupabaseService from './services/SupabaseService';
import { AuthProvider } from './contexts/AuthContext'; // Keep AuthProvider but remove ProtectedRoute

// Hooks
import { useDataManagement } from './hooks/useDataManagement'; 
import { v4 as uuidv4 } from 'uuid';

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

// Robust UUID generator
function generateUUID() {
  // Try to use the imported uuid library first
  try {
    if (typeof uuidv4 === 'function') {
      return uuidv4();
    }
  } catch (e) {
    console.log('uuidv4 not available, using fallback');
  }
  
  // Fallback UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Custom hook for project initialization
function useProjectInitialization(appData) {
  const [projectId, setProjectId] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);
  const isInitializingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    const initializeProject = async () => {
      // Prevent multiple simultaneous initializations and double initialization
      if (isInitializingRef.current || projectId || hasInitializedRef.current) {
        return;
      }
      
      isInitializingRef.current = true;
      
      if (!SupabaseService.isEnabled()) {
        // Generate proper UUID for fallback
        const fallbackId = generateUUID();
        localStorage.setItem('currentProjectId', fallbackId);
        setProjectId(fallbackId);
        setProjectLoading(false);
        isInitializingRef.current = false;
        hasInitializedRef.current = true;
        console.log('⚠️ Supabase not configured, using fallback UUID:', fallbackId);
        return;
      }
      
      try {
        console.log('🚀 Starting project initialization...');
        
        // Get or generate project ID
        let currentProjectId = localStorage.getItem('currentProjectId');
        if (!currentProjectId) {
          currentProjectId = generateUUID();
          localStorage.setItem('currentProjectId', currentProjectId);
          console.log('🆕 Generated new project ID:', currentProjectId);
        } else {
          console.log('🔄 Using existing project ID:', currentProjectId);
        }
        
        // Try to create or get session (but don't fail if it doesn't work)
        let sessionId = null;
        try {
          const sessionResult = await SupabaseService.createOrGetSession();
          if (sessionResult.success) {
            sessionId = sessionResult.data.id;
            console.log('✅ Session ready:', sessionId);
          } else {
            console.warn('⚠️ Failed to create session:', sessionResult.error?.message);
          }
        } catch (sessionError) {
          console.warn('⚠️ Session creation failed, proceeding without session:', sessionError.message);
        }
        
        // Create or verify project exists with proper data
        const projectResult = await SupabaseService.createOrVerifyProject(currentProjectId, {
          session_id: sessionId,
          drawer_width_mm: appData.drawerDimensions?.width,
          drawer_length_mm: appData.drawerDimensions?.length,
          drawer_height_mm: appData.drawerDimensions?.height || 21,
          status: 'layout'
        });
        
        if (projectResult.success) {
          setProjectId(currentProjectId);
          console.log('✅ Project ready:', currentProjectId);
        } else {
          throw new Error(projectResult.error?.message || 'Failed to initialize project');
        }
      } catch (error) {
        console.error('❌ Project initialization error:', error);
        setProjectError(error.message);
        // Fallback to proper UUID
        const fallbackId = generateUUID();
        localStorage.setItem('currentProjectId', fallbackId);
        setProjectId(fallbackId);
        console.log('🔄 Using fallback UUID due to error:', fallbackId);
      } finally {
        setProjectLoading(false);
        isInitializingRef.current = false;
        hasInitializedRef.current = true;
      }
    };
    
    // Only initialize if we have drawer dimensions and haven't initialized yet
    if (appData.drawerDimensions && !projectId && projectLoading && !isInitializingRef.current && !hasInitializedRef.current) {
      initializeProject();
    }
  }, [projectId, projectLoading, appData.drawerDimensions]); // Stable dependencies
  
  return { projectId, projectLoading, projectError };
}

// Separate component for the layout route to prevent re-renders
function LayoutRoute({ appData, dataManager, navUnderlay, updateLayoutConfig }) {
    const resolvedUnderlay = navUnderlay || appData.uploadedImage?.underlay || appData.uploadedImage?.url;
    
    // Use the custom hook for project initialization
    const { projectId, projectLoading, projectError } = useProjectInitialization(appData);
    
    // Only render once after project initialization
    const [rendered, setRendered] = useState(false);
    
    useEffect(() => {
      if (projectLoading) {
        setRendered(false);
      } else {
        setRendered(true);
      }
    }, [projectLoading]);
  
    if (projectLoading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          fontSize: '1.2rem'
        }}>
          Initializing project...
        </div>
      );
    }
    
    if (projectError) {
      console.error('Project error:', projectError);
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          color: 'red',
          flexDirection: 'column'
        }}>
          <div>Error: {projectError}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
          >
            Retry
          </button>
        </div>
      );
    }
    
    if (!rendered) {
      return null;
    }
    
    console.log('🎨 Rendering LayoutDesigner with projectId:', projectId);
    
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
        projectId={projectId}
      />
    );
  }

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
    <AuthProvider>
      <DndProvider backend={HTML5Backend}>
        <Router>
          <AppContainer>
            <Header /> {/* Remove ProtectedRoute wrapper */}
            <AppContent 
              dataManager={dataManager}
              defaultBins={defaultBins}
            />
          </AppContainer>
        </Router>
      </DndProvider>
    </AuthProvider>
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
          {/* Step 1: Drawer Dimensions - Now accessible without login */}
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

          {/* Step 2: Layout Design - Using separate component to prevent re-renders */}
          <Route path="/layout" element={
            appData.drawerDimensions ? (
              <LayoutRoute 
                appData={appData}
                dataManager={dataManager}
                navUnderlay={navUnderlay}
                updateLayoutConfig={updateLayoutConfig}
              />
            ) : (
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
          {/* Login Page */}
  <Route path="/login" element={<Login />} />
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