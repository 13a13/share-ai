
# iOS App Store Deployment Guide for VerifyVision AI

This guide will help you deploy VerifyVision AI to the Apple App Store using Capacitor.

## Prerequisites

- macOS with Xcode installed
- Apple Developer Account ($99/year)
- App Store Connect access
- Valid certificates and provisioning profiles

## Quick Start

1. **Run the deployment script:**
   ```bash
   chmod +x ios-deployment/deploy.sh
   ./ios-deployment/deploy.sh
   ```

2. **Configure in Xcode:**
   - Set your Development Team
   - Configure bundle identifier
   - Set up provisioning profiles
   - Configure app icons and launch screen

3. **Archive and upload:**
   - Product > Archive
   - Upload to App Store Connect
   - Submit for review

## Manual Steps

### 1. Prepare Your Environment

```bash
# Ensure you have the latest dependencies
npm install

# Build your web app
npm run build

# Sync with Capacitor
npx cap sync ios

# Update iOS platform
npx cap update ios
```

### 2. Open in Xcode

```bash
open ios/App/App.xcworkspace
```

### 3. Configure App Settings

In Xcode, configure the following:

#### General Tab:
- **Display Name:** VerifyVision AI
- **Bundle Identifier:** app.lovable.aiproperty
- **Version:** 1.0.0
- **Build:** 1
- **Deployment Target:** iOS 13.0 or higher

#### Signing & Capabilities:
- Select your Development Team
- Ensure "Automatically manage signing" is checked
- Add required capabilities if needed

#### Info Tab:
- Configure app permissions (Camera, Photo Library)
- Set app category to Productivity
- Add app description and keywords

### 4. App Icons and Launch Screen

1. **App Icons:**
   - Add app icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Required sizes: 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

2. **Launch Screen:**
   - Customize `ios/App/App/Base.lproj/LaunchScreen.storyboard`
   - Or add launch images in Assets.xcassets

### 5. Build and Archive

1. **Select Device:**
   - Choose "Any iOS Device (arm64)" from the device menu

2. **Archive:**
   - Product > Archive
   - Wait for build to complete

3. **Upload to App Store:**
   - In Organizer, select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the upload wizard

### 6. App Store Connect Configuration

1. **App Information:**
   - Name: VerifyVision AI
   - Category: Productivity
   - Content Rating: 4+

2. **App Description:**
   ```
   VerifyVision AI is a powerful property inspection and reporting tool that uses artificial intelligence to streamline the property assessment process. Perfect for real estate professionals, property managers, and inspectors.

   Features:
   • AI-powered image analysis
   • Comprehensive property reports
   • Room-by-room inspections
   • Professional PDF exports
   • Cloud-based storage
   • Easy-to-use interface
   ```

3. **Keywords:**
   ```
   property,inspection,AI,reporting,real estate,assessment,documentation
   ```

4. **Support and Marketing URLs:**
   - Support URL: https://verifyvision.ai/support
   - Marketing URL: https://verifyvision.ai
   - Privacy Policy: https://verifyvision.ai/privacy

### 7. Submit for Review

1. **Add Screenshots:**
   - iPhone screenshots (6.5", 5.5")
   - iPad screenshots (12.9", 10.5")
   - Use Simulator or actual devices

2. **App Review Information:**
   - Provide demo account if needed
   - Add review notes
   - Confirm content rating

3. **Submit:**
   - Click "Submit for Review"
   - Wait for Apple's review (typically 1-7 days)

## Troubleshooting

### Common Issues:

1. **Build Errors:**
   - Clean build folder: Product > Clean Build Folder
   - Delete derived data: Xcode > Preferences > Locations > Derived Data
   - Ensure all dependencies are properly installed

2. **Signing Issues:**
   - Verify Apple Developer account status
   - Check certificate validity
   - Ensure provisioning profile matches bundle ID

3. **Upload Issues:**
   - Check bundle ID matches App Store Connect
   - Verify version number is higher than previous
   - Ensure all required metadata is complete

### Getting Help:

- Apple Developer Documentation
- Capacitor iOS Documentation
- Stack Overflow
- Apple Developer Forums

## Important Notes

- **App Store Review Guidelines:** Ensure your app complies with Apple's guidelines
- **Privacy Policy:** Required for apps that collect user data
- **Content Rating:** Choose appropriate rating for your target audience
- **Localization:** Consider adding multiple language support
- **Testing:** Thoroughly test on real devices before submission

## Version Updates

For future updates:
1. Increment version number in `capacitor.config.ts`
2. Update build number in Xcode
3. Rebuild and archive
4. Upload new version to App Store Connect
