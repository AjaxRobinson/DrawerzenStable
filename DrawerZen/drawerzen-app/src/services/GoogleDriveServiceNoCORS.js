/**
 * Alternative Google Drive Service that avoids CORS preflight requests
 * Uses form data instead of JSON to prevent OPTIONS preflight
 */

// Configuration
const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw-skmmpZkU3Pz988vPjNd7s5bX0O-1Bb5KBmmeGuMOfEGCRm_WF-Fh0lx8Ts6ioEpB/exec';

class GoogleDriveServiceNoCORS {
  constructor() {
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Make request using simple POST with text/plain to avoid CORS preflight
   */
  async makeRequest(payload) {
    try {
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  /**
   * Submit customer data to Google Sheets
   */
  async submitCustomerData(customerData) {
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
        orderDetails: JSON.stringify(customerData.bins || []),
        imageUrl: customerData.imageUrl || '',
        status: 'submitted'
      }
    };

    return await this.makeRequest(payload);
  }

  /**
   * Upload image to Google Drive
   */
  async uploadImage(imageFile) {
    try {
      console.log('Starting image upload for file:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);
      
      // Convert file to base64
      const base64Data = await this.fileToBase64(imageFile);
      console.log('Base64 conversion complete, length:', base64Data.length);
      
      const payload = {
        action: 'uploadImage',
        imageData: base64Data,
        fileName: `${this.sessionId}_${imageFile.name}`,
        mimeType: imageFile.type
      };

      console.log('Sending upload request with payload:', {
        action: payload.action,
        fileName: payload.fileName,
        mimeType: payload.mimeType,
        dataLength: payload.imageData.length
      });

      const result = await this.makeRequest(payload);
      console.log('Upload result:', result);
      return result;
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
   * Append order log data
   */
  async appendOrderLog(orderData) {
    const payload = {
      action: 'appendOrderLog',
      rowData: [
        new Date().toISOString(),
        this.sessionId,
        orderData.email,
        orderData.firstName,
        orderData.lastName,
        orderData.phone || '',
        orderData.address,
        orderData.apartment || '',
        orderData.city,
        orderData.state,
        orderData.zipCode,
        orderData.country,
        orderData.drawerDimensions?.width,
        orderData.drawerDimensions?.length,
        orderData.drawerDimensions?.height,
        orderData.bins?.length || 0,
        orderData.totalPrice,
        JSON.stringify(orderData.bins || []),
        orderData.imageUrl || '',
        'completed',
        new Date().toISOString()
      ]
    };

    return await this.makeRequest(payload);
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
   * Save session to sessionStorage
   */
  saveSessionToLocal(data) {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        data: data,
        timestamp: Date.now()
      };
      sessionStorage.setItem('drawerzen_session', JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session to sessionStorage:', error);
    }
  }

  /**
   * Get customer data by session ID (not used in no-CORS approach)
   */
  async getCustomerData(sessionId) {
    // For the no-CORS approach, we primarily use session storage
    return { success: true, data: this.loadSessionFromLocal() };
  }

  /**
   * Update customer data (not implemented for no-CORS)
   */
  async updateCustomerData(updates) {
    // For no-CORS approach, we just update locally
    const currentData = this.loadSessionFromLocal();
    if (currentData) {
      const updatedData = { ...currentData, ...updates };
      this.saveSessionToLocal(updatedData);
    }
    return { success: true };
  }

  /**
   * Submit customer data (not used in simplified approach)
   */
  async submitCustomerData(customerData) {
    // The no-CORS approach primarily uses appendOrderLog for final submission
    return await this.appendOrderLog(customerData);
  }

  getSessionId() {
    return this.sessionId;
  }

  // Session storage methods remain the same
  saveToSession(key, data) {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to session storage:', error);
    }
  }

  getFromSession(key) {
    try {
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting from session storage:', error);
      return null;
    }
  }

  removeFromSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from session storage:', error);
    }
  }

  clearSession() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.startsWith('drawerzen_') || key.startsWith('customer_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      // Also clear the main session
      sessionStorage.removeItem('drawerzen_session');
      this.sessionId = this.generateSessionId();
    } catch (error) {
      console.error('Error clearing session storage:', error);
    }
  }
}

export default new GoogleDriveServiceNoCORS();
