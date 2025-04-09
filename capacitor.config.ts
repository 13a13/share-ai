
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.aiproperty',
  appName: 'AI Property Report',
  webDir: 'dist',
  server: {
    url: 'https://7403e60d-4d19-42b7-8ba7-e6c20e380669.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  android: {
    allowMixedContent: true,
  }
};

export default config;
