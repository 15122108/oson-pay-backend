import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../hooks/useAuth';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isLoading, isLoggedIn } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
      if (!isLoggedIn) {
        router.replace('/login');
      }
    }
  }, [isLoading, isLoggedIn]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0D0D14' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modals/send" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/receive" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/topup" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="modals/addcard" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" backgroundColor="#0D0D14" />
        <RootNavigator />
      </GestureHandlerRootView>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
