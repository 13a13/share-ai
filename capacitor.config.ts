
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aiproperty',
  appName: 'VerifyVision AI',
  webDir: 'dist',
  server: {
    url: 'https://7403e60d-4d19-42b7-8ba7-e6c20e380669.lovableproject.com?forceHideBadge=true',
    cleartext: false, // Disable cleartext traffic
  },
  ios: {
    contentInset: 'always',
    scheme: 'https', // Force HTTPS for iOS
  },
  android: {
    allowMixedContent: false, // Disable mixed content
    androidScheme: 'https', // Force HTTPS for Android
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
