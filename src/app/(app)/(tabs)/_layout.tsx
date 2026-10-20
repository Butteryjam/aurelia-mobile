import React from 'react'
import { Tabs } from 'expo-router'
import { AureliaTabBar } from '@/components/navigation/tab-bar'
import { useAureliaTheme } from '@/theme'

export default function TabLayout() {
  const { colors } = useAureliaTheme()

  return (
    <Tabs
      tabBar={(props) => <AureliaTabBar {...(props as any)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
      initialRouteName="home"
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'Recipes',
        }}
      />
      <Tabs.Screen
        name="planner"
        options={{
          title: 'Planner',
        }}
      />
      <Tabs.Screen
        name="chef"
        options={{
          title: 'AI Chef',
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
        }}
      />
    </Tabs>
  )
}
