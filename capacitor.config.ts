import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.insidegreyroom.game',
  appName: 'Inside Grey Room',
  webDir: 'www',
  server: {
    hostname: 'insidegreyroom.local',
    androidScheme: 'https'
  }
};

export default config;
