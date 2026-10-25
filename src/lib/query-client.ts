import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes fresh
      gcTime: 1000 * 60 * 60 * 24, // 24 hours cache retention
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Immediately cancels all active in-flight queries and clears all cached data from memory.
 * This guarantees that responses for a previous user's queries cannot write back to the cache
 * when switching accounts or signing out.
 */
export async function clearUserQueryCache(): Promise<void> {
  try {
    await queryClient.cancelQueries()
  } catch (err) {
    console.warn('[queryClient] Failed to cancel in-flight queries:', err)
  }
  queryClient.clear()
}

