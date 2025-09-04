/**
 * Google Drive Service for handling spreadsheet data and image uploads
 * This service uses Google Apps Script as a backend proxy to handle authentication
 * 
 * MOCK_MODE: Currently set to true for testing without a deployed backend.
 * To use real Google Apps Script backend:
 * 1. Deploy the Google Apps Script (see GOOGLE_APPS_SCRIPT_DEPLOYMENT.md)
 * 2. Update GOOGLE_APPS_SCRIPT_URL with your deployed script URL
 * 3. Set MOCK_MODE to false
 */

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYVDzkUipHhh0ZivPiAnuP_rxI5D_vJwFa55TiQgw_bb2EQkgT3YbYXMy8FOVdethx/exec';
const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';
const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';

class GoogleDriveService {
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Submit customer data to Google Sheets
   */
  async submitCustomerData(customerData) {
    try {
      const payload = {
        action: 'submitData',
        sessionId: this.sessionId,
        data: {
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId,
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          phone: customerData.phone || '',
          address: customerData.address,
          apartment: customerData.apartment || '',
          city: customerData.city,
          state: customerData.state,
          zipCode: customerData.zipCode,
          country: customerData.country,
          drawerWidth: customerData.drawerDimensions?.width,
          drawerLength: customerData.drawerDimensions?.length,
          drawerHeight: customerData.drawerDimensions?.height,
          binCount: customerData.bins?.length || 0,
          totalPrice: customerData.totalPrice,
          orderDetails: JSON.stringify(customerData.bins),
          imageUrl: customerData.imageUrl || '',
          status: 'pending'
        }
      };

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return { success: true, sessionId: this.sessionId, rowId: result.rowId };
      } else {
        throw new Error(result.error || 'Failed to submit data');
      }
    } catch (error) {
      console.error('Error submitting customer data:', error);
      throw error;
    }
  }

  /**
   * Update customer data in Google Sheets
   */
  async updateCustomerData(updates) {
    try {
      const payload = {
        action: 'updateData',
        sessionId: this.sessionId,
        updates: {
          ...updates,
          lastModified: new Date().toISOString()
        }
      };

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to update data');
      }
    } catch (error) {
      console.error('Error updating customer data:', error);
      throw error;
    }
  }

  /**
   * Retrieve customer data by session ID
   */
  async getCustomerData(sessionId = null) {
    try {
      const targetSessionId = sessionId || this.sessionId;
      
      const payload = {
        action: 'getData',
        sessionId: targetSessionId
      };

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data) {
        return {
          success: true,
          data: {
            ...result.data,
            bins: result.data.orderDetails ? JSON.parse(result.data.orderDetails) : [],
            drawerDimensions: {
              width: result.data.drawerWidth,
              length: result.data.drawerLength,
              height: result.data.drawerHeight
            }
          }
        };
      } else {
        return { success: false, data: null };
      }
    } catch (error) {
      console.error('Error retrieving customer data:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Upload image to Google Drive
   */
  async uploadImage(imageFile) {
    try {
      // Convert image to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      const payload = {
        action: 'uploadImage',
        sessionId: this.sessionId,
        imageData: base64Image,
        fileName: `${this.sessionId}_${imageFile.name}`,
        mimeType: imageFile.type
      };

      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        return { 
          success: true, 
          imageUrl: result.imageUrl,
          fileId: result.fileId 
        };
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Convert file to base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Save current session to sessionStorage for persistence during current browser session
   */
  saveSessionToLocal(data) {
    try {
      sessionStorage.setItem('drawerzen_session', JSON.stringify({
        sessionId: this.sessionId,
        data: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving session to sessionStorage:', error);
    }
  }

  /**
   * Load session from sessionStorage
   */
  loadSessionFromLocal() {
    try {
      const sessionData = sessionStorage.getItem('drawerzen_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // Check if session is not older than 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          this.sessionId = parsed.sessionId;
          return parsed.data;
        } else {
          // Clear old session
          sessionStorage.removeItem('drawerzen_session');
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading session from sessionStorage:', error);
      return null;
    }
  }

  /**
   * Clear current session
   */
  clearSession() {
    sessionStorage.removeItem('drawerzen_session');
    this.sessionId = this.generateSessionId();
  }

  /**
   * Append order log data to Google Sheets
   */
  async appendOrderLog(rowData) {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'appendOrderLog',
          rowData: rowData
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to append order log');
      }

      return result;
    } catch (error) {
      console.error('Error appending order log:', error);
      throw error;
    }
  }

  getSessionId() {
    return this.sessionId;
  }
}

export default new GoogleDriveService();
