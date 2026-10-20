import React from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { useAureliaTheme } from '@/theme'
import type { RecipeFormData } from '@/features/recipes/recipe-form-schema'

interface Props {
  formData: RecipeFormData
  onChange: <K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => void
  errors?: Record<string, string>
}

export function RecipeBasicInfoSection({ formData, onChange, errors }: Props) {
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()

  const handlePrepOrCookChange = (field: 'prepTime' | 'cookTime', val: string) => {
    onChange(field, val)
    const p = field === 'prepTime' ? parseInt(val || '0', 10) : parseInt(formData.prepTime || '0', 10)
    const c = field === 'cookTime' ? parseInt(val || '0', 10) : parseInt(formData.cookTime || '0', 10)
    if (!isNaN(p) && !isNaN(c) && (p > 0 || c > 0)) {
      onChange('totalTime', String(p + c))
    }
  }

  const inputStyle = {
    backgroundColor: colors.card,
    borderColor: colors.border,
    color: colors.foreground,
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fontFamilies.sans,
  }

  const errorInputStyle = {
    borderColor: colors.destructive,
    backgroundColor: colors.destructive + '10',
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          padding: spacing.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <Text
        style={[
          typography.sectionTitle,
          { color: colors.foreground, marginBottom: spacing.base },
        ]}
      >
        Basic Information
      </Text>

      {/* Recipe Title */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
          Recipe Title <Text style={{ color: colors.primary }}>*</Text>
        </Text>
        <TextInput
          style={[
            inputStyle,
            styles.titleInput,
            { fontFamily: fontFamilies.serifBold },
            errors?.title ? errorInputStyle : null,
          ]}
          value={formData.title}
          onChangeText={(text) => onChange('title', text)}
          placeholder="e.g. Saffron Arancini with Truffle Aioli"
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Recipe title"
        />
        {errors?.title ? (
          <Text style={[styles.errorText, { color: colors.destructive, fontFamily: fontFamilies.sans }]}>
            {errors.title}
          </Text>
        ) : null}
      </View>

      {/* Description */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
          Description
        </Text>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={formData.description}
          onChangeText={(text) => onChange('description', text)}
          placeholder="A brief story, aroma notes, or origin of this culinary creation..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Recipe description"
        />
      </View>

      {/* Cuisine & Category Row */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.flex1]}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
            Cuisine
          </Text>
          <TextInput
            style={inputStyle}
            value={formData.cuisine}
            onChangeText={(text) => onChange('cuisine', text)}
            placeholder="e.g. Italian"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Cuisine"
          />
        </View>

        <View style={[styles.fieldGroup, styles.flex1]}>
          <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
            Category
          </Text>
          <TextInput
            style={inputStyle}
            value={formData.category}
            onChangeText={(text) => onChange('category', text)}
            placeholder="e.g. Main Course"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Category"
          />
        </View>
      </View>

      {/* Difficulty Selector */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
          Difficulty
        </Text>
        <View style={styles.difficultyContainer}>
          {(['easy', 'medium', 'hard'] as const).map((diff) => {
            const isSelected = formData.difficulty === diff
            return (
              <Pressable
                key={diff}
                style={[
                  styles.difficultyPill,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.muted,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderRadius: radii.pill,
                  },
                ]}
                onPress={() => onChange('difficulty', diff)}
                accessibilityRole="button"
                accessibilityLabel={`Difficulty ${diff}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text
                  style={[
                    {
                      fontFamily: fontFamilies.sansMedium,
                      fontSize: 13,
                      color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {(
          [
            { key: 'servings', label: 'Servings', placeholder: '4', keyboard: 'number-pad' as const },
            { key: 'prepTime', label: 'Prep (min)', placeholder: '15', keyboard: 'number-pad' as const },
            { key: 'cookTime', label: 'Cook (min)', placeholder: '30', keyboard: 'number-pad' as const },
            { key: 'totalTime', label: 'Total (min)', placeholder: '45', keyboard: 'number-pad' as const },
          ] as const
        ).map(({ key, label, placeholder, keyboard }) => (
          <View key={key} style={styles.metricItem}>
            <Text
              style={[
                styles.metricLabel,
                {
                  color: colors.mutedForeground,
                  fontFamily: fontFamilies.sansMedium,
                },
              ]}
            >
              {label}
            </Text>
            <TextInput
              style={[
                inputStyle,
                styles.metricInput,
                errors?.[key] ? errorInputStyle : null,
              ]}
              value={formData[key as keyof RecipeFormData] as string}
              onChangeText={(val) => {
                if (key === 'prepTime' || key === 'cookTime') {
                  handlePrepOrCookChange(key, val)
                } else {
                  onChange(key as any, val)
                }
              }}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              keyboardType={keyboard}
              accessibilityLabel={`${label} value`}
            />
            {errors?.[key] ? (
              <Text style={[styles.metricErrorText, { color: colors.destructive }]}>
                {errors[key]}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  titleInput: {
    fontSize: 18,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  difficultyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyPill: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    marginBottom: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metricInput: {
    textAlign: 'center',
    paddingHorizontal: 4,
    fontSize: 15,
  },
  metricErrorText: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
})
