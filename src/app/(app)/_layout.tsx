import React from 'react'
import { Stack } from 'expo-router'
import { useAureliaTheme } from '@/theme'

export default function AppLayout() {
  const { colors } = useAureliaTheme()

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="recipe/[id]/index" />
      <Stack.Screen name="recipe/new" />
      <Stack.Screen name="recipe/[id]/edit" />
      <Stack.Screen name="recipe/import" />
      <Stack.Screen name="cook/[id]" />
      <Stack.Screen name="collections/index" />
      <Stack.Screen name="collections/[id]" />
      <Stack.Screen name="shopping/index" />
      <Stack.Screen name="shopping/[id]" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="settings" />
    </Stack>
  )
}
