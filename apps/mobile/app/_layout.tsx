import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import { AuthProvider } from '../lib/auth';
import { OfflineBanner } from '../components/OfflineBanner';

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OfflineBanner />
        <StatusBar style={(scheme === 'dark' ? 'light-content' : 'default') as any} />
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
