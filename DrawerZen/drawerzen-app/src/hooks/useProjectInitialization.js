
import { useState, useEffect, useRef } from 'react';
import SupabaseService from '../services/SupabaseService';

// Robust UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function useProjectInitialization(appData) {
  const [projectId, setProjectId] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    const initializeProject = async () => {
      // Prevent multiple simultaneous initializations
      if (isInitializingRef.current || projectId) {
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
      }
    };
    
    // Only initialize if not already done and not loading
    if (!projectId && projectLoading && !isInitializingRef.current && appData.drawerDimensions) {
      initializeProject();
    }
  }, [projectId, projectLoading, appData.drawerDimensions]); 
  
  return { projectId, projectLoading, projectError };
}