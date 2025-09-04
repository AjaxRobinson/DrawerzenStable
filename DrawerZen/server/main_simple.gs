/**
 * Minimal Google Apps Script for DrawerZen - CORS-free approach
 */

const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';

/**
 * Handle POST requests with text/plain content type to avoid CORS
 */
function doPost(e) {
  try {
    // Parse the JSON from the request body
    const data = JSON.parse(e.postData.contents);
    
    // Handle the appendOrderLog action
    if (data.action === 'appendOrderLog') {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
      sheet.appendRow(data.rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Order logged successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET requests for testing
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ message: 'DrawerZen API is running', timestamp: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
