import React from 'react'
import { Redirect } from 'expo-router'
import { useAuth } from '@/features/auth/auth-context'
import { AuthBootstrapScreen } from '@/components/auth/auth-bootstrap'

export default function IndexScreen() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <AuthBootstrapScreen />
  }

  if (user) {
    return <Redirect href="/(app)/(tabs)/home" />
  }

  return <Redirect href="/(auth)/login" />
}
