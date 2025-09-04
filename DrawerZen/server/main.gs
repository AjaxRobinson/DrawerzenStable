/**
 * Google Apps Script backend for DrawerZen application
 * Handles spreadsheet operations and Google Drive file uploads
 * CORS-enabled version
 */

const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';
const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';

/**
 * Handle GET requests - now also handles data requests via URL parameters
 */
function doGet(e) {
  try {
    // Check if there's data in the URL parameters
    if (e.parameter && e.parameter.data) {
      const data = JSON.parse(e.parameter.data);
      
      let result;
      switch (data.action) {
        case 'submitData':
          result = submitCustomerData(data);
          break;
        case 'updateData':
          result = updateCustomerData(data);
          break;
        case 'getData':
          result = getCustomerData(data);
          break;
        case 'uploadImage':
          result = uploadImageToFolder(data);
          break;
        case 'appendOrderLog':
          result = appendOrderLog(data);
          break;
        default:
          result = { success: false, error: 'Invalid action' };
      }
      
      return ContentService
        .createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
    } else {
      // Default response for basic GET requests
      return ContentService
        .createTextOutput(JSON.stringify({ message: 'DrawerZen API is running' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader('Access-Control-Allow-Origin', '*')
        .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        .setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  } catch (error) {
    console.error('Error in doGet:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*')
      .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
      .setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

/**
 * Generic handler for POST requests from your site
 */
function doPost(e) {
  try {
    let data;
    
    // Handle text/plain content type (no CORS preflight)
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data provided');
    }
    
    let result;
    switch (data.action) {
      case 'submitData':
        result = submitCustomerData(data);
        break;
      case 'updateData':
        result = updateCustomerData(data);
        break;
      case 'getData':
        result = getCustomerData(data);
        break;
      case 'uploadImage':
        result = uploadImageToFolder(data);
        break;
      case 'appendOrderLog':
        result = appendOrderLog(data);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Submit new customer data to the spreadsheet
 */
function submitCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      const headerRow = [
        'Timestamp', 'Session ID', 'Email', 'First Name', 'Last Name', 'Phone',
        'Address', 'Apartment', 'City', 'State', 'Zip Code', 'Country',
        'Drawer Width', 'Drawer Length', 'Drawer Height', 'Bin Count', 
        'Total Price', 'Order Details', 'Image URL', 'Status', 'Last Modified'
      ];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
    
    const data = requestData.data;
    const rowData = [
      data.timestamp,
      data.sessionId,
      data.email,
      data.firstName,
      data.lastName,
      data.phone,
      data.address,
      data.apartment,
      data.city,
      data.state,
      data.zipCode,
      data.country,
      data.drawerWidth,
      data.drawerLength,
      data.drawerHeight,
      data.binCount,
      data.totalPrice,
      data.orderDetails,
      data.imageUrl,
      data.status,
      data.timestamp
    ];
    
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, rowId: newRow };
      
  } catch (error) {
    console.error('Error submitting customer data:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Update existing customer data in the spreadsheet
 */
function updateCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const sessionId = requestData.sessionId;
    const updates = requestData.updates;
    
    // Find the row with matching session ID
    const data = sheet.getDataRange().getValues();
    const sessionIdColumnIndex = 1; // Column B (0-indexed)
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (data[i][sessionIdColumnIndex] === sessionId) {
        // Update specific fields based on what's provided
        const rowIndex = i + 1; // Convert to 1-indexed for Google Sheets
        
        // Map update fields to column indices
        const fieldMap = {
          email: 2, firstName: 3, lastName: 4, phone: 5,
          address: 6, apartment: 7, city: 8, state: 9,
          zipCode: 10, country: 11, drawerWidth: 12, drawerLength: 13,
          drawerHeight: 14, binCount: 15, totalPrice: 16, orderDetails: 17,
          imageUrl: 18, status: 19, lastModified: 20
        };
        
        Object.keys(updates).forEach(field => {
          if (fieldMap[field] !== undefined) {
            sheet.getRange(rowIndex, fieldMap[field] + 1).setValue(updates[field]);
          }
        });
        
        return { success: true };
      }
    }
    
    return { success: false, error: 'Session not found' };
      
  } catch (error) {
    console.error('Error updating customer data:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get customer data by session ID
 */
function getCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const sessionId = requestData.sessionId;
    
    // Find the row with matching session ID
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const sessionIdColumnIndex = 1; // Column B (0-indexed)
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (data[i][sessionIdColumnIndex] === sessionId) {
        const rowData = data[i];
        
        // Create object with header keys and row values
        const customerData = {};
        headers.forEach((header, index) => {
          customerData[header.toLowerCase().replace(/\s+/g, '')] = rowData[index];
        });
        
        return { success: true, data: customerData };
      }
    }
    
    return { success: false, data: null };
      
  } catch (error) {
    console.error('Error getting customer data:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Upload image to Google Drive folder
 */
function uploadImageToFolder(requestData) {
  try {
    const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
    const imageData = requestData.imageData;
    const fileName = requestData.fileName;
    const mimeType = requestData.mimeType;
    
    // Decode base64 image data
    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData),
      mimeType,
      fileName
    );
    
    // Create file in the designated folder
    const file = folder.createFile(blob);
    
    // Make file viewable by anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the shareable URL
    const imageUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
    
    return { 
      success: true, 
      imageUrl: imageUrl,
      fileId: file.getId()
    };
      
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Append order log data to the spreadsheet
 */
function appendOrderLog(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const rowData = requestData.rowData;
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    return { 
      success: true, 
      message: 'Order logged successfully' 
    };
      
  } catch (error) {
    console.error('Error appending order log:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Handle GET requests (for CORS preflight)
 */
function doGet(e) {
  return createCorsResponse('GET request received');
}

/**
 * Main entry point for web app requests
 */
function doPost(e) {
  try {
    let data;
    
    // Handle both JSON and form data
    if (e.postData && e.postData.contents) {
      // Try to parse as JSON first
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonError) {
        // If JSON parsing fails, check if it's form data
        const contentType = e.postData.type;
        if (contentType && contentType.includes('multipart/form-data')) {
          // Extract data from form parameters
          data = JSON.parse(e.parameter.data || '{}');
        } else {
          throw new Error('Unable to parse request data');
        }
      }
    } else if (e.parameter && e.parameter.data) {
      // Handle URL-encoded form data
      data = JSON.parse(e.parameter.data);
    } else {
      throw new Error('No data provided');
    }
    
    let result;
    switch (data.action) {
      case 'submitData':
        result = submitCustomerData(data);
        break;
      case 'updateData':
        result = updateCustomerData(data);
        break;
      case 'getData':
        result = getCustomerData(data);
        break;
      case 'uploadImage':
        result = uploadImageToFolder(data);
        break;
      case 'appendOrderLog':
        result = appendOrderLog(data);
        break;
      default:
        result = { success: false, error: 'Invalid action' };
    }
    
    return createCorsResponse(result);
  } catch (error) {
    console.error('Error in doPost:', error);
    return createCorsResponse({ success: false, error: error.toString() });
  }
}

/**
 * Create response with CORS headers
 */
function createCorsResponse(data) {
  const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
  
  return ContentService
    .createTextOutput(jsonData)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Submit new customer data to the spreadsheet
 */
function submitCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    
    // Ensure headers exist
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers.length === 0 || headers[0] === '') {
      const headerRow = [
        'Timestamp', 'Session ID', 'Email', 'First Name', 'Last Name', 'Phone',
        'Address', 'Apartment', 'City', 'State', 'Zip Code', 'Country',
        'Drawer Width', 'Drawer Length', 'Drawer Height', 'Bin Count', 
        'Total Price', 'Order Details', 'Image URL', 'Status', 'Last Modified'
      ];
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
    }
    
    const data = requestData.data;
    const rowData = [
      data.timestamp,
      data.sessionId,
      data.email,
      data.firstName,
      data.lastName,
      data.phone,
      data.address,
      data.apartment,
      data.city,
      data.state,
      data.zipCode,
      data.country,
      data.drawerWidth,
      data.drawerLength,
      data.drawerHeight,
      data.binCount,
      data.totalPrice,
      data.orderDetails,
      data.imageUrl,
      data.status,
      data.timestamp
    ];
    
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    return { success: true, rowId: newRow };
      
  } catch (error) {
    console.error('Error submitting customer data:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Update existing customer data in the spreadsheet
 */
function updateCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const sessionId = requestData.sessionId;
    const updates = requestData.updates;
    
    // Find the row with matching session ID
    const data = sheet.getDataRange().getValues();
    const sessionIdColumnIndex = 1; // Column B (0-indexed)
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (data[i][sessionIdColumnIndex] === sessionId) {
        // Update specific fields based on what's provided
        const rowIndex = i + 1; // Convert to 1-indexed for Google Sheets
        
        // Map update fields to column indices
        const fieldMap = {
          email: 2, firstName: 3, lastName: 4, phone: 5,
          address: 6, apartment: 7, city: 8, state: 9,
          zipCode: 10, country: 11, drawerWidth: 12, drawerLength: 13,
          drawerHeight: 14, binCount: 15, totalPrice: 16, orderDetails: 17,
          imageUrl: 18, status: 19, lastModified: 20
        };
        
        Object.keys(updates).forEach(field => {
          if (fieldMap[field] !== undefined) {
            sheet.getRange(rowIndex, fieldMap[field] + 1).setValue(updates[field]);
          }
        });
        
        return ContentService
          .createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Session not found' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error updating customer data:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Get customer data by session ID
 */
function getCustomerData(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const sessionId = requestData.sessionId;
    
    // Find the row with matching session ID
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const sessionIdColumnIndex = 1; // Column B (0-indexed)
    
    for (let i = 1; i < data.length; i++) { // Skip header row
      if (data[i][sessionIdColumnIndex] === sessionId) {
        const rowData = data[i];
        
        // Create object with header keys and row values
        const customerData = {};
        headers.forEach((header, index) => {
          customerData[header.toLowerCase().replace(/\s+/g, '')] = rowData[index];
        });
        
        return ContentService
          .createTextOutput(JSON.stringify({ success: true, data: customerData }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, data: null }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error getting customer data:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Upload image to Google Drive folder
 */
function uploadImageToFolder(requestData) {
  try {
    const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
    const imageData = requestData.imageData;
    const fileName = requestData.fileName;
    const mimeType = requestData.mimeType;
    
    // Decode base64 image data
    const blob = Utilities.newBlob(
      Utilities.base64Decode(imageData),
      mimeType,
      fileName
    );
    
    // Create file in the designated folder
    const file = folder.createFile(blob);
    
    // Make file viewable by anyone with the link
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Get the shareable URL
    const imageUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        imageUrl: imageUrl,
        fileId: file.getId()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error uploading image:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Append order log data to the spreadsheet
 */
function appendOrderLog(requestData) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
    const rowData = requestData.rowData;
    
    // Append the row to the sheet
    sheet.appendRow(rowData);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: 'Order logged successfully' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error appending order log:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}