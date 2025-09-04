# DrawerZen - React Application

This is a React-based application for custom storage bin design, deployed via GitHub Pages.

## ⚠️ IMPORTANT: GitHub Pages Configuration

**This repository uses GitHub Actions for deployment, NOT Jekyll.**

If you're seeing Jekyll-related errors, you need to configure GitHub Pages properly:

### 1. Go to Repository Settings
1. Navigate to your repository on GitHub
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar

### 2. Configure Source
**CRITICAL:** Set the source to "GitHub Actions"
- Under "Source", select "GitHub Actions" (NOT "Deploy from a branch")
- This tells GitHub to use our custom workflow instead of Jekyll

### 3. Files that disable Jekyll
- `.nojekyll` (at repository root) - Disables Jekyll processing
- `_config.yml` - Explicitly disables Jekyll
- `drawerzen-app/public/.nojekyll` - Disables Jekyll for build output

## Deployment Process

1. **Automatic**: Push to `main` branch triggers deployment
2. **Manual**: Run workflow from Actions tab
3. **Build**: React app is built using webpack
4. **Deploy**: Static files are deployed to GitHub Pages

## Local Development

```bash
cd DrawerZen/drawerzen-app
npm install
npm start
```

## Architecture

- **Frontend**: React app (GitHub Pages)
- **Backend**: Google Apps Script
- **Data**: Google Sheets + Google Drive
- **Deployment**: GitHub Actions workflow

## Key Features

- Customer data logging to Google Sheets
- Image upload to Google Drive
- Session persistence across page refreshes
- Mobile-responsive design
- 3D bin visualization

---

**If Jekyll errors persist after following the setup above, the issue is that GitHub Pages source is not set to "GitHub Actions" in your repository settings.**
