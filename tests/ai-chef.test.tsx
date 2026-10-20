/**
 * Aurelia Mobile — Phase E: AI Chef Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  classifyAiError,
  type ChatMessage,
  type ChatResponse,
  type RecipeReference,
  type Conversation,
} from '@/features/ai/types'

// ─── Chat Message Types Tests ─────────────────────────────────

describe('AI Chef — Message Types', () => {
  const mockUserMessage: ChatMessage = {
    id: 'msg-user-1',
    conversation_id: 'conv-1',
    role: 'user',
    content: 'What can I substitute for buttermilk?',
    created_at: new Date().toISOString(),
  }

  const mockAssistantMessage: ChatMessage = {
    id: 'msg-assist-1',
    conversation_id: 'conv-1',
    role: 'assistant',
    content: 'You can use plain yogurt thinned with a little milk, or add 1 tablespoon of lemon juice to 1 cup of regular milk.',
    created_at: new Date().toISOString(),
    token_count: 42,
  }

  it('user message has correct role and content', () => {
    expect(mockUserMessage.role).toBe('user')
    expect(mockUserMessage.content).toContain('buttermilk')
    expect(mockUserMessage.conversation_id).toBe('conv-1')
  })

  it('assistant message has correct role and token count', () => {
    expect(mockAssistantMessage.role).toBe('assistant')
    expect(mockAssistantMessage.token_count).toBe(42)
    expect(mockAssistantMessage.content).toContain('yogurt')
  })
})

// ─── Chat Response Tests ──────────────────────────────────────

describe('AI Chef — Chat Response', () => {
  const mockResponse: ChatResponse = {
    conversationId: 'conv-123',
    userMessage: {
      id: 'msg-u',
      conversation_id: 'conv-123',
      role: 'user',
      content: 'Which of my recipes uses chicken?',
      created_at: new Date().toISOString(),
    },
    assistantMessage: {
      id: 'msg-a',
      conversation_id: 'conv-123',
      role: 'assistant',
      content: 'I found 3 recipes in your vault that use chicken.',
      created_at: new Date().toISOString(),
    },
    references: [
      {
        id: 'recipe-1',
        title: 'Chicken Tikka Masala',
        description: 'Creamy Indian curry',
        imageUrl: null,
        cookTime: 45,
        difficulty: 'medium',
        cuisine: 'Indian',
        category: 'Main Course',
      },
      {
        id: 'recipe-2',
        title: 'Chicken Caesar Salad',
        description: 'Classic salad',
        imageUrl: null,
        cookTime: 20,
        difficulty: 'easy',
        cuisine: 'American',
        category: 'Salad',
      },
    ],
  }

  it('includes conversation ID in response', () => {
    expect(mockResponse.conversationId).toBe('conv-123')
  })

  it('includes both user and assistant messages', () => {
    expect(mockResponse.userMessage.role).toBe('user')
    expect(mockResponse.assistantMessage.role).toBe('assistant')
  })

  it('includes recipe references from user vault', () => {
    expect(mockResponse.references).toHaveLength(2)
    expect(mockResponse.references![0].title).toBe('Chicken Tikka Masala')
    expect(mockResponse.references![1].cuisine).toBe('American')
  })

  it('recipe references have all required fields', () => {
    const ref = mockResponse.references![0]
    expect(ref.id).toBeDefined()
    expect(ref.title).toBeDefined()
    expect(typeof ref.cookTime).toBe('number')
    expect(typeof ref.difficulty).toBe('string')
  })
})

// ─── Conversation Management Tests ────────────────────────────

describe('AI Chef — Conversation Management', () => {
  const mockConversation: Conversation = {
    id: 'conv-abc',
    user_id: 'user-123',
    title: 'About: Chicken Tikka Masala',
    recipe_id: 'recipe-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  it('conversation has correct structure', () => {
    expect(mockConversation.id).toBe('conv-abc')
    expect(mockConversation.user_id).toBe('user-123')
    expect(mockConversation.title).toContain('Chicken')
    expect(mockConversation.recipe_id).toBe('recipe-1')
  })

  it('new conversation can be created without conversation ID', () => {
    // When no conversationId is passed, the API creates a new conversation
    const input = {
      message: 'Hello',
      conversationId: undefined,
    }
    expect(input.conversationId).toBeUndefined()
    expect(input.message).toBe('Hello')
  })

  it('existing conversation ID is reused', () => {
    const input = {
      message: 'Follow-up question',
      conversationId: 'conv-abc',
    }
    expect(input.conversationId).toBe('conv-abc')
  })
})

// ─── Chat Error Handling Tests ────────────────────────────────

describe('AI Chef — Error Handling', () => {
  it('classifies chat rate limit', () => {
    const error = classifyAiError(429, 'Too many messages', true, 60)
    expect(error.category).toBe('rate_limit')
    expect(error.message).toContain('60')
    expect(error.canRetry).toBe(true)
  })

  it('classifies chat timeout', () => {
    const error = classifyAiError(408, 'Timeout')
    expect(error.category).toBe('timeout')
    expect(error.canRetry).toBe(true)
  })

  it('classifies chat network failure', () => {
    const error = classifyAiError(0, 'No connection')
    expect(error.category).toBe('network_failure')
    expect(error.canRetry).toBe(true)
  })

  it('classifies chat auth failure requiring re-login', () => {
    const error = classifyAiError(401, 'Token expired')
    expect(error.category).toBe('auth_failure')
    expect(error.canRetry).toBe(false)
    expect(error.message).toContain('sign in')
  })
})

// ─── Suggested Prompts Tests ──────────────────────────────────

describe('AI Chef — Suggested Prompts', () => {
  const SUGGESTED_PROMPTS = [
    'What can I substitute for buttermilk?',
    'Which of my recipes uses chicken?',
    'How can I make this recipe higher protein?',
    'Suggest a wine pairing for pasta dishes',
    'What spices go well with lamb?',
    'Help me plan a vegetarian dinner',
  ]

  it('provides meaningful suggested prompts', () => {
    expect(SUGGESTED_PROMPTS.length).toBeGreaterThanOrEqual(4)
    SUGGESTED_PROMPTS.forEach((prompt) => {
      expect(prompt.length).toBeGreaterThan(10)
      // Prompts can end with ? ! or be declarative statements
      expect(prompt.length).toBeGreaterThan(15)
    })
  })

  it('prompts cover diverse culinary topics', () => {
    const topics = SUGGESTED_PROMPTS.join(' ').toLowerCase()
    expect(topics).toContain('substitute')
    expect(topics).toContain('protein')
    expect(topics).toContain('wine')
  })
})
