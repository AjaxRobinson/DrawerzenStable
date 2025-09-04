# DrawerZen Setup Instructions

## Overview
The DrawerZen application has been updated to support remote deployment via GitHub Pages with backend data persistence through Google Drive and Google Apps Script.

## Architecture Changes

### Frontend (GitHub Pages)
- React application deployed to GitHub Pages
- Automatic deployment via GitHub Actions
- Data persistence through localStorage and server sync

### Backend (Google Apps Script)
- Google Apps Script serves as the backend API
- Handles spreadsheet operations and file uploads
- CORS-enabled web app for cross-origin requests

### Data Flow
1. User input is immediately saved to localStorage
2. Data is synced to Google Sheets via Apps Script API
3. Images are uploaded to Google Drive
4. Session management allows data recovery on page refresh/return

## Setup Steps

### 1. Google Apps Script Deployment

1. Go to [Google Apps Script](https://script.google.com)
2. Create a new project
3. Copy the contents of `server/main.gs` into the script editor
4. Update the SPREADSHEET_ID and IMAGES_FOLDER_ID constants
5. Deploy as web app:
   - Execute as: Me
   - Who has access: Anyone
6. Copy the web app URL

### 2. Google Drive Setup

1. **Spreadsheet Setup:**
   - Open the existing spreadsheet: https://docs.google.com/spreadsheets/d/1ijH_CALFSduEmzpiRfXUANvcg4uYX_kMnWoSIQ6YuoE/edit
   - Ensure it has appropriate permissions
   - The script will automatically create headers if needed

2. **Images Folder Setup:**
   - Access the folder: https://drive.google.com/drive/folders/1hjb0LiweW7LqWA-F20KuBvv0UdIprZnF
   - Ensure it has appropriate permissions for file uploads

### 3. Frontend Configuration

1. Update `src/services/GoogleDriveService.js`:
   - Replace `GOOGLE_APPS_SCRIPT_URL` with your deployed script URL

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update environment variables in `.env`

### 4. GitHub Pages Deployment

1. **Automatic Deployment:**
   - Push to main branch triggers automatic deployment
   - GitHub Actions workflow builds and deploys to gh-pages branch

2. **Manual Deployment:**
   ```bash
   npm run build
   npm run deploy
   ```

### 5. Testing

1. **Local Development:**
   ```bash
   cd DrawerZen/drawerzen-app
   npm install
   npm start
   ```

2. **Production Testing:**
   - Access the live site at: https://ajaxrobinson.github.io/DZInternalTesting
   - Test all user flows from drawer setup through checkout
   - Verify data persistence across page refreshes

## Data Management Features

### Session Persistence
- Each user gets a unique session ID
- Data is saved locally and synced to server
- URL includes session ID for sharing/returning

### Data Recovery
- Users can return to incomplete orders
- Page refreshes don't lose progress
- Cross-device access via session URL

### Real-time Sync
- Customer info updates sync immediately
- Images upload in background
- Order data preserved throughout flow

## Key Changes Made

### 1. Removed Payment Processing
- Removed Stripe integration as requested
- Checkout now submits order for internal review
- Payment fields removed from checkout form

### 2. Added Data Persistence
- GoogleDriveService for API communication
- useDataManagement hook for state management
- Automatic data sync and recovery

### 3. Updated Components
- DrawerSetup: Integrated image upload and data sync
- OrderReview: Uses server-side data when available
- Checkout: Customer info pre-filled and synced
- Added OrderSuccess page for completion

### 4. GitHub Pages Compatibility
- Updated webpack config for proper asset paths
- Added deployment workflow
- Environment-specific configuration

## Monitoring and Maintenance

### Google Apps Script
- Monitor execution logs in Apps Script dashboard
- Check quotas and limits
- Update permissions as needed

### Google Drive
- Monitor storage usage
- Organize uploaded images
- Review spreadsheet data quality

### GitHub Pages
- Monitor deployment status in Actions tab
- Check build logs for errors
- Update dependencies regularly

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure Apps Script is deployed as web app with public access
   - Check that the correct URL is used in frontend

2. **Data Not Saving:**
   - Verify spreadsheet and folder permissions
   - Check Apps Script execution logs
   - Ensure session ID is being generated

3. **Deployment Failures:**
   - Check GitHub Actions logs
   - Verify package.json homepage URL
   - Ensure all dependencies are properly installed

### Support
For technical issues, check:
1. Browser console for frontend errors
2. Apps Script logs for backend errors
3. GitHub Actions logs for deployment issues

## Future Enhancements

1. **Authentication:**
   - Add user accounts and login
   - Secure session management
   - Order history tracking

2. **Payment Processing:**
   - Re-integrate Stripe for production
   - Add payment status tracking
   - Implement order fulfillment workflow

3. **Admin Dashboard:**
   - Order management interface
   - Customer data analytics
   - Production workflow tools
