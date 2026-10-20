/**
 * Aurelia Mobile — AI Chef Tab Screen
 *
 * Production-quality chat experience grounded in the user's recipe vault.
 * Uses POST /api/ai/chat for conversations.
 * Supports conversation management, recipe references, markdown rendering.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  Sparkles,
  Send,
  Plus,
  RefreshCw,
  X,
  MessageSquare,
  ChefHat,
  BookOpen,
  Clock,
  AlertCircle,
  Trash2,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useAuth } from '@/features/auth/auth-context'
import {
  useSendChatMessage,
  useConversations,
  useConversationMessages,
  useDeleteConversation,
} from '@/features/ai/hooks'
import { classifyAiError, type ChatMessage, type RecipeReference, type ChatResponse } from '@/features/ai/types'
import { MarkdownText } from '@/components/ai/markdown-text'

const SUGGESTED_PROMPTS = [
  'What can I substitute for buttermilk?',
  'Which of my recipes uses chicken?',
  'How can I make this recipe higher protein?',
  'Suggest a wine pairing for pasta dishes',
  'What spices go well with lamb?',
  'Help me plan a vegetarian dinner',
]

export default function ChefTabScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  // State
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [references, setReferences] = useState<Map<string, RecipeReference[]>>(new Map())
  const [inputText, setInputText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const scrollViewRef = useRef<ScrollView>(null)

  // Hooks
  const sendMessage = useSendChatMessage()
  const { data: conversations, refetch: refetchConversations } = useConversations()
  const { data: loadedMessages } = useConversationMessages(conversationId)
  const deleteConversation = useDeleteConversation()

  // Sync loaded messages
  useEffect(() => {
    if (loadedMessages && loadedMessages.length > 0) {
      setMessages(loadedMessages)
    }
  }, [loadedMessages])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0 || sendMessage.isPending || errorMessage) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true })
      }, 100)
    }
  }, [messages.length, sendMessage.isPending, errorMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sendMessage.cancel()
    }
  }, [])

  // ─── Send Message ────────────────────────────────────────

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = (text || inputText).trim()
      if (!messageText) return

      setInputText('')
      setErrorMessage(null)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

      // Optimistic user message
      const optimisticUserMsg: ChatMessage = {
        id: `temp_${Date.now()}`,
        conversation_id: conversationId || '',
        role: 'user',
        content: messageText,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, optimisticUserMsg])

      try {
        const response = await sendMessage.mutateAsync({
          message: messageText,
          conversationId: conversationId || undefined,
        })

        // Update conversation ID for new conversations
        if (!conversationId && response.conversationId) {
          setConversationId(response.conversationId)
        }

        // Replace optimistic message with real one and add assistant response
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== optimisticUserMsg.id)
          return [...filtered, response.userMessage, response.assistantMessage]
        })

        // Store references
        if (response.references && response.references.length > 0) {
          setReferences((prev) => {
            const next = new Map(prev)
            next.set(response.assistantMessage.id, response.references!)
            return next
          })
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      } catch (err: any) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMsg.id))
        const errorInfo = classifyAiError(
          err.status || null,
          err.message,
          err.rateLimited,
          err.retryAfterSeconds
        )
        setErrorMessage(errorInfo.message)
        // Restore input text on failure
        setInputText(messageText)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      }
    },
    [inputText, conversationId, sendMessage]
  )

  const handleNewConversation = useCallback(() => {
    setConversationId(null)
    setMessages([])
    setReferences(new Map())
    setErrorMessage(null)
    setInputText('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  }, [])

  const handleSelectConversation = useCallback((convId: string) => {
    setConversationId(convId)
    setMessages([])
    setReferences(new Map())
    setErrorMessage(null)
  }, [])

  const handleDeleteConversation = useCallback(
    async (convId: string) => {
      try {
        await deleteConversation.mutateAsync(convId)
        if (conversationId === convId) {
          handleNewConversation()
        }
      } catch (err) {
        // Silently fail
      }
    },
    [conversationId, deleteConversation, handleNewConversation]
  )

  const handleRetry = useCallback(() => {
    if (inputText.trim()) {
      handleSend()
    }
  }, [inputText, handleSend])

  // ─── Empty State ─────────────────────────────────────────

  const isEmptyConversation = messages.length === 0 && !conversationId

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
          <View style={styles.headerLeft}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 19, marginLeft: 8 }]}>
              AI Chef
            </Text>
          </View>

          <Pressable
            onPress={handleNewConversation}
            style={({ pressed }) => [
              styles.newChatButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start new conversation"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={18} color={colors.primary} />
          </Pressable>
        </View>

        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.messagesContainer, { paddingBottom: 10 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Empty State */}
          {isEmptyConversation && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: colors.secondary, borderRadius: radii.pill }]}>
                <ChefHat size={32} color={colors.primary} />
              </View>

              <Text style={[typography.sectionTitle, { color: colors.foreground, marginTop: spacing.lg, textAlign: 'center' }]}>
                Your Culinary Advisor
              </Text>
              <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 }]}>
                Ask about substitutions, techniques, wine pairings, or anything from your recipe vault. I'll ground my answers in your saved recipes.
              </Text>

              <Text style={[typography.eyebrow, { color: colors.primary, marginTop: spacing.xxl }]}>
                Try Asking
              </Text>

              <View style={styles.suggestedContainer}>
                {SUGGESTED_PROMPTS.map((prompt, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSend(prompt)}
                    style={({ pressed }) => [
                      styles.suggestedChip,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: radii.control,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Ask: ${prompt}`}
                  >
                    <Text style={[typography.body, { color: colors.foreground }]} numberOfLines={2}>
                      {prompt}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Recent Conversations */}
              {conversations && conversations.length > 0 && (
                <View style={{ marginTop: spacing.xxl, width: '100%' }}>
                  <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
                    Recent Conversations
                  </Text>
                  {conversations.slice(0, 5).map((conv) => (
                    <Pressable
                      key={conv.id}
                      onPress={() => handleSelectConversation(conv.id)}
                      style={({ pressed }) => [
                        styles.conversationRow,
                        {
                          backgroundColor: pressed ? colors.muted + '40' : 'transparent',
                          borderBottomColor: colors.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Continue conversation: ${conv.title}`}
                    >
                      <MessageSquare size={16} color={colors.mutedForeground} />
                      <Text style={[typography.body, { color: colors.foreground, flex: 1, marginLeft: 10 }]} numberOfLines={1}>
                        {conv.title}
                      </Text>
                      <Pressable
                        onPress={() => handleDeleteConversation(conv.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityRole="button"
                        accessibilityLabel="Delete conversation"
                      >
                        <Trash2 size={14} color={colors.mutedForeground} />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Chat Messages */}
          {messages.map((msg) => (
            <View key={msg.id} style={styles.messageWrapper}>
              {/* Message Bubble */}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.primary, borderRadius: radii.card }]
                    : [styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.card }],
                ]}
                accessibilityRole="text"
                accessibilityLabel={`${msg.role === 'user' ? 'You' : 'AI Chef'}: ${msg.content.substring(0, 100)}`}
              >
                {msg.role === 'assistant' && (
                  <View style={styles.assistantLabel}>
                    <Sparkles size={12} color={colors.primary} />
                    <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
                      AI Chef
                    </Text>
                  </View>
                )}

                {msg.role === 'user' ? (
                  <Text style={[typography.body, { color: colors.primaryForeground, lineHeight: 22 }]}>
                    {msg.content}
                  </Text>
                ) : (
                  <MarkdownText content={msg.content} />
                )}
              </View>

              {/* Recipe References */}
              {msg.role === 'assistant' && references.get(msg.id) && (
                <View style={styles.referencesContainer}>
                  <Text style={[typography.caption, { color: colors.mutedForeground, marginBottom: 6 }]}>
                    Referenced Recipes:
                  </Text>
                  {references.get(msg.id)!.map((ref) => (
                    <Pressable
                      key={ref.id}
                      onPress={() => router.push(`/(app)/recipe/${ref.id}`)}
                      style={({ pressed }) => [
                        styles.referenceCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderRadius: radii.control,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`View recipe: ${ref.title}`}
                    >
                      <BookOpen size={14} color={colors.primary} />
                      <Text style={[typography.bodyMedium, { color: colors.foreground, marginLeft: 8, flex: 1 }]} numberOfLines={1}>
                        {ref.title}
                      </Text>
                      {ref.cuisine && (
                        <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                          {ref.cuisine}
                        </Text>
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* Loading indicator for pending message */}
          {sendMessage.isPending && (
            <View style={[styles.messageBubble, styles.assistantBubble, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.card }]}>
              <View style={styles.assistantLabel}>
                <Sparkles size={12} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700', marginLeft: 4 }]}>
                  AI Chef
                </Text>
              </View>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 8 }]}>
                  Thinking…
                </Text>
              </View>
            </View>
          )}

          {/* Error */}
          {errorMessage && (
            <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '40', borderRadius: radii.control }]}>
              <AlertCircle size={16} color={colors.destructive} />
              <Text style={[typography.body, { color: colors.destructive, flex: 1, marginLeft: 8 }]}>
                {errorMessage}
              </Text>
              <Pressable
                onPress={handleRetry}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Retry message"
              >
                <RefreshCw size={16} color={colors.destructive} />
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Composer */}
        <View
          style={[
            styles.composerContainer,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View
            style={[
              styles.composerInputContainer,
              { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.control },
            ]}
          >
            <TextInput
              style={[typography.body, styles.composerInput, { color: colors.foreground }]}
              placeholder="Ask your AI Chef…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              maxLength={2000}
              value={inputText}
              onChangeText={setInputText}
              accessibilityLabel="Chat message input"
            />
          </View>

          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || sendMessage.isPending}
            style={({ pressed }) => [
              styles.sendButton,
              {
                backgroundColor:
                  inputText.trim() && !sendMessage.isPending
                    ? colors.primary
                    : colors.muted,
                borderRadius: radii.pill,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Send
              size={18}
              color={
                inputText.trim() && !sendMessage.isPending
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 8,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedContainer: {
    marginTop: 16,
    width: '100%',
    gap: 8,
  },
  suggestedChip: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 44,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  assistantLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  referencesContainer: {
    marginTop: 6,
    paddingLeft: 8,
    maxWidth: '85%',
  },
  referenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    marginBottom: 4,
    minHeight: 44,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  composerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  composerInputContainer: {
    flex: 1,
    borderWidth: 1,
    maxHeight: 120,
  },
  composerInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    lineHeight: 22,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
})
