
#!/bin/bash

# iOS App Store Deployment Script for VerifyVision AI
# This script automates the build and deployment process

set -e

echo "🚀 Starting iOS deployment for VerifyVision AI..."

# Configuration
APP_NAME="VerifyVision AI"
SCHEME="App"
CONFIGURATION="Release"
WORKSPACE="ios/App/App.xcworkspace"
EXPORT_METHOD="app-store"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    print_error "Please run this script from the root of your project"
    exit 1
fi

# Check if iOS platform is added
if [ ! -d "ios" ]; then
    print_error "iOS platform not found. Please run 'npx cap add ios' first"
    exit 1
fi

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm install

# Step 2: Build the web app
print_status "Building web application..."
npm run build

# Step 3: Sync with Capacitor
print_status "Syncing with Capacitor..."
npx cap sync ios

# Step 4: Update iOS project
print_status "Updating iOS project..."
npx cap update ios

# Step 5: Open Xcode for manual steps
print_warning "Opening Xcode for manual configuration..."
print_warning "Please ensure the following in Xcode:"
print_warning "1. Set your Development Team"
print_warning "2. Configure App Store Connect settings"
print_warning "3. Set up proper provisioning profiles"
print_warning "4. Configure app icons and launch screen"
print_warning "5. Set deployment target to iOS 13.0 or higher"

# Open Xcode
open ios/App/App.xcworkspace

print_status "Deployment preparation complete!"
print_warning "Next steps:"
echo "1. Configure your app in Xcode"
echo "2. Archive your app (Product > Archive)"
echo "3. Upload to App Store Connect"
echo "4. Submit for review"

echo ""
print_status "For detailed instructions, see ios-deployment/README.md"
