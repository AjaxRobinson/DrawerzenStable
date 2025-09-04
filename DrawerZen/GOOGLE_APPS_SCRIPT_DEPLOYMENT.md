# Google Apps Script Deployment Guide

## Prerequisites
1. Google account with access to Google Apps Script
2. Access to the Google Sheets document (ID: 1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE)
3. Access to the Google Drive folder (ID: 1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF)

## Step 1: Create the Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click "New Project"
3. Replace the default code with the contents of `server/main.gs`
4. Save the project with a meaningful name like "DrawerZen Backend"

## Step 2: Configure the Script

1. Verify the constants at the top of the file:
   ```javascript
   const SPREADSHEET_ID = '1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE';
   const IMAGES_FOLDER_ID = '1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF';
   ```

2. Update these IDs if your spreadsheet or folder IDs are different

## Step 3: Enable Required APIs

1. In the Apps Script editor, click on "Services" (+ icon) in the left sidebar
2. Add these services if not already enabled:
   - Google Sheets API
   - Google Drive API

## Step 4: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose type: "Web app"
3. Configuration:
   - Description: "DrawerZen Backend API"
   - Execute as: "Me"
   - Who has access: "Anyone"
4. Click "Deploy"
5. **Copy the Web App URL** - you'll need this for the frontend

## Step 5: Update Frontend Configuration

1. Open `src/services/GoogleDriveService.js`
2. Replace the placeholder URL:
   ```javascript
   const GOOGLE_APPS_SCRIPT_URL = 'YOUR_DEPLOYED_SCRIPT_URL_HERE';
   ```
   With your actual deployed URL

## Step 6: Test the Integration

1. Deploy your frontend changes
2. Test the complete flow:
   - Enter drawer dimensions
   - Upload an image
   - Design layout
   - Review order
   - Submit checkout

## Step 7: Verify Data in Google Sheets

After testing, check your Google Sheets document to verify:
- Customer data is being saved
- Order logs are being appended
- Images are being uploaded to Google Drive

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure the Apps Script is deployed with "Anyone" access
2. **Permission Errors**: Ensure the script has permission to access your sheets and drive
3. **404 Errors**: Verify the Web App URL is correct and the script is deployed

### Debugging:

1. Check the Apps Script logs: Go to your script → "Executions" to see any errors
2. Check browser console for frontend errors
3. Verify the spreadsheet and folder IDs are correct

## Security Notes

- The Apps Script runs with your Google account permissions
- Only deploy with "Anyone" access if you're comfortable with public access
- Consider implementing additional validation/authentication for production use
- The current setup is suitable for prototyping and testing

## Data Structure

The order log will contain these columns:
1. Timestamp
2. Session ID
3. Email
4. First Name
5. Last Name
6. Phone
7. Address
8. Apartment
9. City
10. State
11. Zip Code
12. Country
13. Drawer Dimensions (JSON)
14. Layout Config (JSON)
15. Total Price
16. Image URL
17. Status
