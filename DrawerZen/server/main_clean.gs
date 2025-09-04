/**
 * Clean Google Apps Script for DrawerZen order logging and image uploads
 * This version handles both order submission and image uploads
 */

function doPost(e) {
  try {
    // Parse the JSON from the request body
    const data = JSON.parse(e.postData.contents);
    
    console.log('Received action:', data.action);
    
    // Handle the appendOrderLog action
    if (data.action === 'appendOrderLog') {
      const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
      
      // Add headers if this is the first row
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          'Timestamp',
          'Session ID',
          'Email',
          'First Name',
          'Last Name',
          'Phone',
          'Address',
          'Apartment',
          'City',
          'State',
          'Zip Code',
          'Country',
          'Drawer Width',
          'Drawer Length',
          'Drawer Height',
          'Bin Count',
          'Total Price',
          'Layout JSON',
          'Image URL',
          'Status'
        ]);
      }
      
      sheet.appendRow(data.rowData);
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Order logged successfully' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Handle the uploadImage action
    if (data.action === 'uploadImage') {
      const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';
      
      try {
        console.log('Starting image upload process...');
        console.log('Image data length:', data.imageData ? data.imageData.length : 'No data');
        console.log('File name:', data.fileName);
        console.log('MIME type:', data.mimeType);
        
        // Validate input data
        if (!data.imageData) {
          throw new Error('No image data provided');
        }
        if (!data.fileName) {
          throw new Error('No file name provided');
        }
        if (!data.mimeType) {
          throw new Error('No MIME type provided');
        }
        
        // Convert base64 to blob
        console.log('Converting base64 to blob...');
        const imageBlob = Utilities.newBlob(
          Utilities.base64Decode(data.imageData),
          data.mimeType,
          data.fileName
        );
        console.log('Blob created successfully');
        
        // Get the folder
        console.log('Accessing Google Drive folder...');
        const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
        console.log('Folder accessed:', folder.getName());
        
        // Upload to Google Drive
        console.log('Creating file in Drive...');
        const file = folder.createFile(imageBlob);
        console.log('File created with ID:', file.getId());
        
        // Make the file publicly viewable
        console.log('Setting file permissions...');
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        console.log('File permissions set');
        
        // Get the public URL
        const imageUrl = `https://drive.google.com/file/d/${file.getId()}/view`;
        console.log('Image uploaded successfully, URL:', imageUrl);
        
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: true, 
            imageUrl: imageUrl,
            fileId: file.getId(),
            message: 'Image uploaded successfully' 
          }))
          .setMimeType(ContentService.MimeType.JSON);
          
      } catch (error) {
        console.error('Error uploading image:', error);
        console.error('Error details:', error.toString());
        return ContentService
          .createTextOutput(JSON.stringify({ 
            success: false, 
            error: 'Failed to upload image: ' + error.toString(),
            details: error.message || 'Unknown error'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action: ' + data.action }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Error in doPost:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ 
      message: 'DrawerZen Order API is running', 
      timestamp: new Date().toISOString() 
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function to verify Google Drive access
 * Run this manually in the Apps Script editor to authorize permissions
 */
function testDriveAccess() {
  try {
    const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';
    const folder = DriveApp.getFolderById(IMAGES_FOLDER_ID);
    console.log('Successfully accessed folder:', folder.getName());
    
    // Test creating a simple text file
    const testBlob = Utilities.newBlob('Test file content', 'text/plain', 'test_file.txt');
    const testFile = folder.createFile(testBlob);
    console.log('Test file created with ID:', testFile.getId());
    
    // Clean up - delete the test file
    DriveApp.getFileById(testFile.getId()).setTrashed(true);
    console.log('Test file deleted');
    
    return 'Drive access test successful';
  } catch (error) {
    console.error('Drive access test failed:', error);
    return 'Drive access test failed: ' + error.toString();
  }
}