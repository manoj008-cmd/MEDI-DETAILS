import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../hooks/useAuth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="medicines/index" />
          <Stack.Screen name="medicines/add" />
          <Stack.Screen name="medicines/[id]" />
          <Stack.Screen name="family/index" />
          <Stack.Screen name="analytics/index" />
          <Stack.Screen name="emergency-card/index" />
          <Stack.Screen name="prescription-scan/index" />
        </Stack>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
