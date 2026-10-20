/**
 * Aurelia Mobile — Simple Markdown Renderer for React Native
 *
 * Renders markdown using RN primitives only. No dangerouslySetInnerHTML.
 * Supports: bold, italic, code, lists, headers, line breaks.
 */

import React from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { useAureliaTheme } from '@/theme'

interface MarkdownTextProps {
  content: string
  style?: any
}

export function MarkdownText({ content, style }: MarkdownTextProps) {
  const { colors, typography, spacing, radii } = useAureliaTheme()

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <Text
          key={i}
          style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.xs }]}
        >
          {parseInline(line.slice(4), colors, typography)}
        </Text>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <Text
          key={i}
          style={[typography.cardTitle, { color: colors.foreground, marginTop: spacing.md, marginBottom: spacing.xs }]}
        >
          {parseInline(line.slice(3), colors, typography)}
        </Text>
      )
      continue
    }
    if (line.startsWith('# ')) {
      elements.push(
        <Text
          key={i}
          style={[typography.sectionTitle, { color: colors.foreground, marginTop: spacing.md, marginBottom: spacing.xs }]}
        >
          {parseInline(line.slice(2), colors, typography)}
        </Text>
      )
      continue
    }

    // Unordered list
    if (/^[-*]\s/.test(line)) {
      elements.push(
        <View key={i} style={mdStyles.listItem}>
          <Text style={[typography.body, { color: colors.mutedForeground, width: 16 }]}>•</Text>
          <Text style={[typography.body, { color: colors.foreground, flex: 1 }, style]}>
            {parseInline(line.replace(/^[-*]\s/, ''), colors, typography)}
          </Text>
        </View>
      )
      continue
    }

    // Ordered list
    const orderedMatch = line.match(/^(\d+)\.\s/)
    if (orderedMatch) {
      elements.push(
        <View key={i} style={mdStyles.listItem}>
          <Text style={[typography.body, { color: colors.mutedForeground, width: 22 }]}>
            {orderedMatch[1]}.
          </Text>
          <Text style={[typography.body, { color: colors.foreground, flex: 1 }, style]}>
            {parseInline(line.replace(/^\d+\.\s/, ''), colors, typography)}
          </Text>
        </View>
      )
      continue
    }

    // Empty line = spacer
    if (line.trim() === '') {
      elements.push(<View key={i} style={{ height: spacing.sm }} />)
      continue
    }

    // Regular paragraph
    elements.push(
      <Text key={i} style={[typography.body, { color: colors.foreground, lineHeight: 22 }, style]}>
        {parseInline(line, colors, typography)}
      </Text>
    )
  }

  return <View>{elements}</View>
}

/**
 * Parses inline markdown: **bold**, *italic*, `code`
 */
function parseInline(text: string, colors: any, typography: any): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Match **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      parts.push(
        <Text key={`b${match.index}`} style={{ fontWeight: '700' }}>
          {match[2]}
        </Text>
      )
    } else if (match[3]) {
      // *italic*
      parts.push(
        <Text key={`i${match.index}`} style={{ fontStyle: 'italic' }}>
          {match[3]}
        </Text>
      )
    } else if (match[4]) {
      // `code`
      parts.push(
        <Text
          key={`c${match.index}`}
          style={{
            fontFamily: 'monospace',
            backgroundColor: colors.muted,
            paddingHorizontal: 4,
            borderRadius: 4,
            fontSize: 13,
          }}
        >
          {match[4]}
        </Text>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : [text]
}

const mdStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
})
