import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Family CFO AI',
  slug: 'family-cfo-ai',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'familycfo',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.familycfo.app',
    buildNumber: '1',
    infoPlist: {
      NSCameraUsageDescription: 'Для сканирования чеков',
      NSPhotoLibraryUsageDescription: 'Для выбора фото чека',
    },
  },
  android: {
    package: 'com.familycfo.app',
    versionCode: 1,
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-camera',
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
});
