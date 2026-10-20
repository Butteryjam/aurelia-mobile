/**
 * Aurelia Mobile — Tab Bar (Design System Aligned)
 *
 * Premium tab bar with:
 * - Active tab indicator pill above the icon (web-style active state)
 * - Terracotta primary color for active items
 * - Warm card background matching the web nav
 * - Keyboard-dismiss support
 */

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Keyboard,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import {
  Compass,
  BookOpen,
  CalendarDays,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { TABS } from '@/constants/navigation'

export interface AureliaTabBarProps {
  state: any
  descriptors: any
  navigation: any
}

export function AureliaTabBar({ state, descriptors, navigation }: AureliaTabBarProps) {
  const { colors, fontFamilies } = useAureliaTheme()
  const insets = useSafeAreaInsets()
  const [isKeyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    )
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    )

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  if (isKeyboardVisible) {
    return null
  }

  const bottomInset = Math.max(insets.bottom, 8)

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomInset,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route: any, index: number) => {
        if (route.name === 'index') return null

        const isFocused = state.index === index
        const { options } = descriptors[route.key]

        const tabConfig = TABS.find((t) => t.name === route.name)
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : tabConfig?.label || route.name

        const IconComponent = tabConfig?.icon || Compass

        const color = isFocused ? colors.primary : colors.mutedForeground

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          })

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params)
          }
        }

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          })
        }

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${label}, tab ${index + 1} of ${TABS.length}`}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && styles.tabItemPressed,
            ]}
          >
            {/* Active indicator pill */}
            <View
              style={[
                styles.indicatorPill,
                {
                  backgroundColor: isFocused ? colors.primary : 'transparent',
                  opacity: isFocused ? 1 : 0,
                },
              ]}
            />

            <View style={styles.iconContainer}>
              <IconComponent size={21} color={color} />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color,
                  fontFamily: isFocused
                    ? fontFamilies.sansBold
                    : fontFamilies.sansMedium,
                },
              ]}
              numberOfLines={1}
            >
              {typeof label === 'string' ? label : tabConfig?.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  tabItem: {
    flex: 1,
    minHeight: 52,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  indicatorPill: {
    width: 20,
    height: 2.5,
    borderRadius: 999,
    marginBottom: 6,
    marginTop: 0,
  },
  iconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10.5,
    lineHeight: 14,
    marginTop: 3,
  },
})
