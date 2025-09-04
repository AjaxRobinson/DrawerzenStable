// SupabaseService.js (fixed version)
import { createClient } from '@supabase/supabase-js';

// Configuration with proper fallbacks and validation
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://dobvwnfsglqzdnsymzsp.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvYnZ3bmZzZ2xxemRuc3ltenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NTQ2MDYsImV4cCI6MjA3MDUzMDYwNn0.5hAAfdqya9ggpIC2cUdCHrruNxEN4TMaMWuR0KhSdqs';
const SUPABASE_BUCKET = process.env.REACT_APP_SUPABASE_BUCKET || 'drawerzen';
const SUPABASE_TABLE = process.env.REACT_APP_SUPABASE_TABLE || 'dataset';
const SUPABASE_ORDERS_TABLE = process.env.REACT_APP_SUPABASE_ORDERS_TABLE || 'orders';
const SUPABASE_BINS_TABLE = process.env.REACT_APP_SUPABASE_BINS_TABLE || 'bins';
const SUPABASE_PROJECTS_TABLE = process.env.REACT_APP_SUPABASE_PROJECTS_TABLE || 'drawer_projects';

class SupabaseService {
  constructor() {
    this.bucket = SUPABASE_BUCKET;
    this.table = SUPABASE_TABLE;
    this.ordersTable = SUPABASE_ORDERS_TABLE;
    this.binsTable = SUPABASE_BINS_TABLE;
    this.projectsTable = SUPABASE_PROJECTS_TABLE;
    
    // Validate configuration
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Missing Supabase URL or Anon Key');
      this.client = null;
      this.enabled = false;
      return;
    }
    
    try {
      this.client = createClient(SUPABASE_URL.trim(), SUPABASE_ANON_KEY.trim());
      this.enabled = true;
      console.log('✅ Supabase DB Connection Success');
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      this.client = null;
      this.enabled = false;
    }
  }

  /**
   * Check if Supabase service is properly configured
   * @returns {boolean} Service enabled status
   */
  isEnabled() {
    return this.enabled && this.client !== null;
  }

  /**
   * Upload image to Supabase storage
   * @param {string} path - Storage path
   * @param {Blob} blob - Image blob
   * @param {string} contentType - MIME type
   * @returns {Promise<Object>} Upload result
   */
  async uploadImage(path, blob, contentType = 'image/jpeg') {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }
    
    try {
      const { data, error } = await this.client.storage
        .from(this.bucket)
        .upload(path, blob, { 
          contentType, 
          upsert: true 
        });
      
      if (error) {
        console.error('❌ Image upload failed:', error);
        return { success: false, error };
      }
      
      const { data: publicUrlData } = this.client.storage
        .from(this.bucket)
        .getPublicUrl(path);
      
      return { 
        success: true, 
        data, 
        publicUrl: publicUrlData?.publicUrl 
      };
    } catch (error) {
      console.error('❌ Image upload error:', error);
      return { success: false, error };
    }
  }

  /**
   * Insert record with duplicate handling (uses sample_id for dataset table)
   * @param {Object} record - Record to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertRecord(record) {
    return this.insertIntoWithDuplicateCheck(this.table, record, 'sample_id');
  }

  /**
   * Insert into table with duplicate checking and user confirmation
   * @param {string} tableName - Target table name
   * @param {Object} record - Record to insert
   * @param {string} duplicateCheckField - Field to check for duplicates (default: 'sample_id' for dataset table)
   * @returns {Promise<Object>} Insert result
   */
  async insertIntoWithDuplicateCheck(tableName, record, duplicateCheckField = 'sample_id') {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Check for existing record with same sample_id
      const { data: existingRecords, error: checkError } = await this.client
        .from(tableName)
        .select('*')
        .eq(duplicateCheckField, record[duplicateCheckField]);

      if (checkError) {
        console.error(`❌ Duplicate check failed for ${tableName}:`, checkError);
        return { success: false, error: checkError };
      }

      // If duplicate found, ask user for confirmation
      if (existingRecords && existingRecords.length > 0) {
        const existingRecord = existingRecords[0];
        const userConfirmed = window.confirm(
          `A record with the ${duplicateCheckField} "${record[duplicateCheckField]}" already exists. Do you want to update it?`
        );

        if (userConfirmed) {
          // Update existing record
          const { data, error } = await this.client
            .from(tableName)
            .update(record)
            .eq('id', existingRecord.id)
            .select();

          if (error) {
            console.error(`❌ Record update failed for ${tableName}:`, error);
            return { success: false, error };
          }

          console.log(`✅ Record updated in ${tableName}:`, data[0]);
          return { 
            success: true, 
            data, 
            updated: true,
            message: 'Record updated successfully' 
          };
        } else {
          return { 
            success: false, 
            cancelled: true,
            message: 'Operation cancelled by user' 
          };
        }
      }

      // No duplicate, proceed with insertion
      const { data, error } = await this.client
        .from(tableName)
        .insert(record)
        .select();

      if (error) {
        console.error(`❌ Record insertion failed for ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`✅ Record inserted into ${tableName}:`, data[0]);
      return { 
        success: true, 
        data,
        inserted: true,
        message: 'Record inserted successfully' 
      };
    } catch (error) {
      console.error(`❌ Record operation error for ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Insert record without duplicate checking
   * @param {string} tableName - Target table name
   * @param {Object|Array} record - Record(s) to insert
   * @returns {Promise<Object>} Insert result
   */
  async insertInto(tableName, record) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.client
        .from(tableName)
        .insert(record)
        .select();

      if (error) {
        console.error(`❌ Record insertion failed for ${tableName}:`, error);
        return { success: false, error };
      }

      console.log(`✅ Records inserted into ${tableName}:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`❌ Record insertion error for ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Insert order record
   * @param {Object} orderRecord - Order data
   * @returns {Promise<Object>} Insert result
   */
  async insertOrder(orderRecord) {
    return this.insertInto(this.ordersTable, orderRecord);
  }

  /**
   * Save bins for a project
   * @param {string} projectId - Project UUID
   * @param {Array} bins - Array of bin objects
   * @returns {Promise<Object>} Save result
   */
  async saveBins(projectId, bins) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }
  
    try {
      // First, delete existing bins for this project
      const { error: deleteError } = await this.client
        .from(this.binsTable)
        .delete()
        .eq('project_id', projectId);
  
      if (deleteError) {
        console.error('❌ Failed to delete existing bins:', deleteError);
        return { success: false, error: deleteError };
      }
  
      // Prepare bins data for insertion - ensure each bin has a unique ID
      const binsData = bins.map(bin => ({
        id: bin.id || uuidv4(), 
        project_id: projectId,
        x_mm: bin.x,
        y_mm: bin.y,
        width_mm: bin.width,
        length_mm: bin.length,
        height_mm: bin.height,
        color: bin.color,
        colorway: bin.colorway,
        shadow_board: bin.shadowBoard,
        name: bin.name
      }));
  
      // Insert new bins
      const { data, error } = await this.client
        .from(this.binsTable)
        .insert(binsData)
        .select();
  
      if (error) {
        console.error('❌ Failed to save bins:', error);
        return { success: false, error };
      }
  
      console.log(`✅ ${binsData.length} bins saved for project ${projectId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error saving bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Get bins by project ID
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Query result
   */
  async getBinsByProjectId(projectId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.client
        .from(this.binsTable)
        .select('*')
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Failed to fetch bins:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Delete bins by project ID
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBinsByProjectId(projectId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.client
        .from(this.binsTable)
        .delete()
        .eq('project_id', projectId);

      if (error) {
        console.error('❌ Failed to delete bins:', error);
        return { success: false, error };
      }

      console.log(`✅ Bins deleted for project ${projectId}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error deleting bins:', error);
      return { success: false, error };
    }
  }

  /**
   * Get all records from a table
   * @param {string} tableName - Table name
   * @returns {Promise<Object>} Query result
   */
  async getAllRecords(tableName) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.client
        .from(tableName)
        .select('*');

      if (error) {
        console.error(`❌ Failed to fetch records from ${tableName}:`, error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error(`❌ Error fetching records from ${tableName}:`, error);
      return { success: false, error };
    }
  }

  /**
   * Get record by sample_id (for dataset table)
   * @param {string} sampleId - Sample ID
   * @returns {Promise<Object>} Query result
   */
  async getDatasetBySampleId(sampleId) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.client
        .from(this.table)
        .select('*')
        .eq('sample_id', sampleId)
        .single();

      if (error) {
        console.error('❌ Failed to fetch dataset record:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Error fetching dataset record:', error);
      return { success: false, error };
    }
  }
  /**
 * Create or verify project exists
 * @param {string} projectId - Project UUID
 * @param {Object} projectData - Project data
 * @returns {Promise<Object>} Project result
 */
async createOrVerifyProject(projectId, projectData = {}) {
  if (!this.isEnabled()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Check if project already exists (without using .single() to avoid 406 error)
    const { data: existingProjects, error: checkError } = await this.client
      .from(this.projectsTable)
      .select('*')
      .eq('id', projectId)
      .limit(1);

    // Handle actual errors (not the "no rows" case)
    if (checkError) {
      // PGRST116 is the "no rows" error which is expected when project doesn't exist
      if (checkError.code !== 'PGRST116') {
        console.error('Error checking project:', checkError);
        return { success: false, error: checkError };
      }
      // If it's PGRST116 (no rows), continue to create project
    }

    // If project exists, return it
    if (existingProjects && existingProjects.length > 0) {
      console.log('✅ Project already exists:', existingProjects[0].id);
      return { success: true, data: existingProjects[0] };
    }

    // Create new project with required fields
    const newProjectData = {
      id: projectId,
      session_id: projectData.session_id || this.generateUUID(), // Add this method
      sample_id: projectData.sample_id || `sample_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      drawer_width_mm: projectData.drawer_width_mm || 320,
      drawer_length_mm: projectData.drawer_length_mm || 320,
      drawer_height_mm: projectData.drawer_height_mm || 21,
      status: projectData.status || 'draft',
      unit: projectData.unit || 'mm',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.client
      .from(this.projectsTable)
      .insert(newProjectData)
      .select();

    if (error) {
      console.error('❌ Error creating project:', error);
      return { success: false, error };
    }

    console.log('✅ Project created successfully:', data[0]);
    return { success: true, data: data[0] };
  } catch (error) {
    console.error('❌ Error in createOrVerifyProject:', error);
    return { success: false, error };
  }
}
// Add this method to your SupabaseService
async createOrGetSession(sessionId = null) {
  if (!this.isEnabled()) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    let sessionIdToUse = sessionId;
    
    // If no session ID provided, generate one or get from localStorage
    if (!sessionIdToUse) {
      sessionIdToUse = localStorage.getItem('currentSessionId');
      if (!sessionIdToUse) {
        sessionIdToUse = this.generateUUID();
        localStorage.setItem('currentSessionId', sessionIdToUse);
      }
    }

    // Check if session exists
    const { data: existingSessions, error: checkError } = await this.client
      .from('sessions')
      .select('*')
      .eq('id', sessionIdToUse)
      .limit(1);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking session:', checkError);
      return { success: false, error: checkError };
    }

    // If session exists, return it
    if (existingSessions && existingSessions.length > 0) {
      return { success: true, data: existingSessions[0] };
    }

    // Create new session
    const sessionData = {
      id: sessionIdToUse,
      started_at: new Date().toISOString(),
      last_active_at: new Date().toISOString()
      // Add other session fields as needed
    };

    const { data, error } = await this.client
      .from('sessions')
      .insert(sessionData)
      .select();

    if (error) {
      console.error('Error creating session:', error);
      return { success: false, error };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error in createOrGetSession:', error);
    return { success: false, error };
  }
}

// Add this helper method to SupabaseService class
generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}



}


export default new SupabaseService();