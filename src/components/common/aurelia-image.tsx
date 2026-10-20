import React, { useState } from 'react'
import { StyleSheet, View, type ViewStyle, type ImageStyle } from 'react-native'
import { Image, type ImageContentFit } from 'expo-image'
import { Utensils } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

interface AureliaImageProps {
  source: string | null | undefined
  style?: ImageStyle | ViewStyle | (ImageStyle | ViewStyle)[]
  contentFit?: ImageContentFit
  accessibilityLabel?: string
  aspectRatio?: number
  fallbackIconSize?: number
}

export function AureliaImage({
  source,
  style,
  contentFit = 'cover',
  accessibilityLabel = 'Recipe illustration',
  aspectRatio,
  fallbackIconSize = 24,
}: AureliaImageProps) {
  const { colors } = useAureliaTheme()
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  const cleanSource = typeof source === 'string' && source.trim().length > 0 ? source.trim() : null

  if (!cleanSource || hasError) {
    return (
      <View
        style={[
          styles.placeholderContainer,
          { backgroundColor: colors.muted, borderColor: colors.border },
          aspectRatio ? { aspectRatio } : null,
          style as any,
        ]}
        accessibilityRole="image"
        accessibilityLabel={`${accessibilityLabel} placeholder`}
      >
        <Utensils size={fallbackIconSize} color={colors.mutedForeground} opacity={0.6} />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.wrapper,
        aspectRatio ? { aspectRatio } : null,
        style as any,
      ]}
    >
      <Image
        source={{ uri: cleanSource }}
        style={[StyleSheet.absoluteFill, styles.image]}
        contentFit={contentFit}
        transition={200}
        accessibilityLabel={accessibilityLabel}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        cachePolicy="memory-disk"
      />
      {!isLoaded && (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.placeholderContainer,
            { backgroundColor: colors.muted },
          ]}
        >
          <Utensils size={fallbackIconSize} color={colors.mutedForeground} opacity={0.4} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
})
