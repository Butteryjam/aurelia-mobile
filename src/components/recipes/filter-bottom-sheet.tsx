import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X, Check } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import type { RecipeFilters, RecipeDifficulty } from '@/features/recipes/types'

interface FilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  filters: RecipeFilters
  onApply: (newFilters: RecipeFilters) => void
  availableCuisines: string[]
  availableCategories: string[]
}

const DIFFICULTIES: Array<{ label: string; value: 'all' | RecipeDifficulty }> = [
  { label: 'All', value: 'all' },
  { label: 'Easy', value: 'easy' },
  { label: 'Medium', value: 'medium' },
  { label: 'Hard', value: 'hard' },
]

const COOK_TIMES = [
  { label: 'Any Time', value: null },
  { label: '< 30 min', value: 30 },
  { label: '< 45 min', value: 45 },
  { label: '< 60 min', value: 60 },
]

export function FilterBottomSheet({
  visible,
  onClose,
  filters,
  onApply,
  availableCuisines,
  availableCategories,
}: FilterBottomSheetProps) {
  const { colors, typography, spacing, radii } = useAureliaTheme()

  const [tempFavoriteOnly, setTempFavoriteOnly] = useState(Boolean(filters.favoriteOnly))
  const [tempDifficulty, setTempDifficulty] = useState<'all' | RecipeDifficulty>(
    filters.difficulty ?? 'all'
  )
  const [tempMaxCookTime, setTempMaxCookTime] = useState<number | null>(
    filters.maxCookTime ?? null
  )
  const [tempCuisine, setTempCuisine] = useState<string>(filters.cuisine ?? 'all')
  const [tempCategory, setTempCategory] = useState<string>(filters.category ?? 'all')

  const handleReset = () => {
    setTempFavoriteOnly(false)
    setTempDifficulty('all')
    setTempMaxCookTime(null)
    setTempCuisine('all')
    setTempCategory('all')
  }

  const handleApply = () => {
    onApply({
      ...filters,
      favoriteOnly: tempFavoriteOnly,
      difficulty: tempDifficulty,
      maxCookTime: tempMaxCookTime,
      cuisine: tempCuisine === 'all' ? undefined : tempCuisine,
      category: tempCategory === 'all' ? undefined : tempCategory,
    })
    onClose()
  }

  if (!visible) return null

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop dismiss */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Dismiss filters"
        />

        {/* Sheet Content */}
        <SafeAreaView
          edges={['bottom']}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 19 }]}>
                Filter Recipes
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                Refine by cuisine, time, and difficulty
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Filter Controls Scroll */}
          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* 1. Favorites Only Switch */}
            <View
              style={[
                styles.filterRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radii.card,
                  padding: spacing.base,
                },
              ]}
            >
              <View>
                <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
                  Favorites Only
                </Text>
                <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                  Show only starred heirloom dishes
                </Text>
              </View>
              <Switch
                value={tempFavoriteOnly}
                onValueChange={setTempFavoriteOnly}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>

            {/* 2. Difficulty */}
            <View style={styles.section}>
              <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
                Difficulty
              </Text>
              <View style={styles.chipsRow}>
                {DIFFICULTIES.map((d) => {
                  const isSelected = tempDifficulty === d.value
                  return (
                    <Pressable
                      key={d.value}
                      onPress={() => setTempDifficulty(d.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radii.pill,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Difficulty ${d.label}`}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? colors.primaryForeground : colors.foreground,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* 3. Cook Time */}
            <View style={styles.section}>
              <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
                Max Cook Time
              </Text>
              <View style={styles.chipsRow}>
                {COOK_TIMES.map((t) => {
                  const isSelected = tempMaxCookTime === t.value
                  return (
                    <Pressable
                      key={t.label}
                      onPress={() => setTempMaxCookTime(t.value)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: radii.pill,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Cook time ${t.label}`}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: isSelected ? colors.primaryForeground : colors.foreground,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* 4. Cuisine */}
            {availableCuisines.length > 0 && (
              <View style={styles.section}>
                <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
                  Cuisine
                </Text>
                <View style={styles.chipsRow}>
                  <Pressable
                    onPress={() => setTempCuisine('all')}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tempCuisine === 'all' ? colors.primary : colors.background,
                        borderColor: tempCuisine === 'all' ? colors.primary : colors.border,
                        borderRadius: radii.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: tempCuisine === 'all' ? colors.primaryForeground : colors.foreground,
                          fontWeight: tempCuisine === 'all' ? '600' : '400',
                        },
                      ]}
                    >
                      All Cuisines
                    </Text>
                  </Pressable>

                  {availableCuisines.map((c) => {
                    const isSelected = tempCuisine.toLowerCase() === c.toLowerCase()
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setTempCuisine(c)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.primary : colors.background,
                            borderColor: isSelected ? colors.primary : colors.border,
                            borderRadius: radii.pill,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isSelected ? colors.primaryForeground : colors.foreground,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {c}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleReset}
              style={[
                styles.resetButton,
                { borderColor: colors.border, borderRadius: radii.control },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Reset all filters"
            >
              <Text style={[typography.bodyMedium, { color: colors.mutedForeground, fontSize: 14 }]}>
                Reset
              </Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              style={[
                styles.applyButton,
                { backgroundColor: colors.primary, borderRadius: radii.control },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
            >
              <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' }]}>
                Apply Filters
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    borderTopWidth: 1,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButton: {
    flex: 2,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
