import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { Plus, X, Tag } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
}

const SUGGESTED_TAGS = [
  'Dinner',
  'Quick & Easy',
  'Vegetarian',
  'Healthy',
  'Comfort Food',
  'Dessert',
  'Baking',
  'Meal Prep',
  'Gluten-Free',
]

export function RecipeTagsSection({ tags, onChange }: Props) {
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()
  const [inputTag, setInputTag] = useState('')

  const handleAddTag = (textToAdd?: string) => {
    const raw = textToAdd !== undefined ? textToAdd : inputTag
    const clean = raw.trim()
    if (!clean) return

    if (!tags.includes(clean)) {
      onChange([...tags, clean])
    }
    if (textToAdd === undefined) {
      setInputTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove))
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
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Tag size={18} color={colors.primary} />
          <Text style={[typography.sectionTitle, { color: colors.foreground }]}>
            Tags &amp; Curation
          </Text>
        </View>
      </View>
      <Text style={[typography.caption, { color: colors.mutedForeground, marginBottom: spacing.base }]}>
        Add labels for quick filtering, diet categories and occasions
      </Text>

      {/* Selected Tag Chips */}
      {tags.length > 0 ? (
        <View style={styles.tagChipsWrap}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[
                styles.tagChip,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary + '40',
                  borderRadius: radii.pill,
                },
              ]}
            >
              <Text
                style={[
                  styles.tagChipText,
                  { color: colors.primary, fontFamily: fontFamilies.sansMedium },
                ]}
              >
                {tag}
              </Text>
              <Pressable
                onPress={() => handleRemoveTag(tag)}
                style={styles.removeTagButton}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
              >
                <X size={12} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {/* Tag Input Field */}
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.muted,
              borderColor: colors.border,
              color: colors.foreground,
              borderRadius: radii.control,
              fontFamily: fontFamilies.sans,
            },
          ]}
          value={inputTag}
          onChangeText={setInputTag}
          placeholder="Add custom tag (e.g. Artisanal)..."
          placeholderTextColor={colors.mutedForeground}
          onSubmitEditing={() => handleAddTag()}
          returnKeyType="done"
          accessibilityLabel="New tag input"
        />
        <Pressable
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.control,
              opacity: !inputTag.trim() ? 0.5 : 1,
            },
          ]}
          onPress={() => handleAddTag()}
          disabled={!inputTag.trim()}
          accessibilityRole="button"
          accessibilityLabel="Add custom tag"
        >
          <Plus size={16} color={colors.primaryForeground} />
          <Text
            style={[
              styles.addButtonText,
              { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium },
            ]}
          >
            Add
          </Text>
        </Pressable>
      </View>

      {/* Suggested Tags Pills */}
      <View style={styles.suggestionsContainer}>
        <Text
          style={[
            typography.eyebrow,
            { color: colors.mutedForeground, fontSize: 10, marginBottom: 8 },
          ]}
        >
          Quick Suggestions:
        </Text>
        <View style={styles.suggestedPillsWrap}>
          {SUGGESTED_TAGS.map((sug) => {
            const isAdded = tags.includes(sug)
            return (
              <Pressable
                key={sug}
                disabled={isAdded}
                onPress={() => handleAddTag(sug)}
                style={[
                  styles.suggestedPill,
                  {
                    backgroundColor: isAdded ? colors.muted : colors.card,
                    borderColor: isAdded ? colors.border : colors.border,
                    borderRadius: radii.pill,
                    opacity: isAdded ? 0.6 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Add suggested tag ${sug}`}
              >
                <Text
                  style={[
                    {
                      fontFamily: fontFamilies.sans,
                      fontSize: 11,
                      color: isAdded ? colors.mutedForeground : colors.foreground,
                    },
                  ]}
                >
                  {isAdded ? `✓ ${sug}` : `+ ${sug}`}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tagChipText: {
    fontSize: 12,
  },
  removeTagButton: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
  },
  addButtonText: {
    fontSize: 13,
  },
  suggestionsContainer: {
    marginTop: 4,
  },
  suggestedPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestedPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
  },
})
