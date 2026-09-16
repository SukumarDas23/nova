import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nova.ai',
  appName: 'NOVA',
  webDir: 'www',
  server: {
    // Load live Oracle Cloud server — same approach as Electron desktop app
    url: 'http://129.159.239.56',
    cleartext: true,         // allow HTTP (non-HTTPS) on Android
    androidScheme: 'http',
  },
  android: {
    backgroundColor: '#0d0d0f',  // match NOVA dark theme
  },
};

export default config;
