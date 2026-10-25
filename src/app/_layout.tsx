import React, { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold'
import { PlayfairDisplay_600SemiBold } from '@expo-google-fonts/playfair-display/600SemiBold'
import { PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display/400Regular'
import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular'
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium'
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold'
import { queryClient } from '@/lib/query-client'
import { AuthProvider, useAuth } from '@/features/auth/auth-context'
import { AuthBootstrapScreen } from '@/components/auth/auth-bootstrap'
import { ThemeModeProvider, useThemeMode } from '@/theme/theme-context'
import { useAureliaTheme } from '@/theme'

SplashScreen.preventAutoHideAsync().catch(() => {})

function AuthNavigationGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isTransitioning } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading || isTransitioning) return

    const segs = segments as unknown as string[]
    const inAuthGroup = segs[0] === '(auth)'
    const inAppGroup = segs[0] === '(app)'
    const isResetPassword = segs[1] === 'reset-password'

    if (!user && inAppGroup) {
      const cleanSegments = segs.filter((s) => !s.startsWith('('))
      const targetPath = cleanSegments.length > 0 ? `/${cleanSegments.join('/')}` : null
      if (targetPath) {
        router.replace({
          pathname: '/(auth)/login',
          params: { redirect: targetPath },
        } as any)
      } else {
        router.replace('/(auth)/login')
      }
    } else if (user && inAuthGroup && !isResetPassword) {
      router.replace('/(app)/(tabs)/home')
    }
  }, [user, isLoading, isTransitioning, segments, router])

  if (isLoading || isTransitioning) {
    return <AuthBootstrapScreen />
  }

  return <>{children}</>
}

function AppShell() {
  const { colors } = useAureliaTheme()
  const { isDark } = useThemeMode()

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthNavigationGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthNavigationGuard>
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_400Regular,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider>
          <AuthProvider>
            <AppShell />
          </AuthProvider>
        </ThemeModeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}
