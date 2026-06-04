import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MobileErrorBoundary } from '../components/status/MobileErrorBoundary';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MobileErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </MobileErrorBoundary>
    </SafeAreaProvider>
  );
}
