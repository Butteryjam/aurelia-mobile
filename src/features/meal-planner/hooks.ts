/**
 * Aurelia Mobile — TanStack Query Hooks for Meal Planner
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import {
  fetchMealPlanForWeek,
  fetchRecipesForPicker,
  addMealPlanItem,
  updateMealPlanItem,
  toggleMealPlanItemCooked,
  deleteMealPlanItem,
} from './api'
import type {
  AddMealPlanItemInput,
  UpdateMealPlanItemInput,
  DayMeals,
} from './types'

export const MEAL_PLAN_KEYS = {
  all: ['meal-plan'] as const,
  userAll: (userId?: string | null) =>
    userId ? (['meal-plan', userId] as const) : (['meal-plan'] as const),
  week: (start: string, end: string, userId?: string | null) =>
    userId
      ? (['meal-plan-week', userId, start, end] as const)
      : (['meal-plan-week', start, end] as const),
  picker: (search?: string, userId?: string | null) =>
    userId
      ? (['meal-planner-recipes', userId, search || ''] as const)
      : (['meal-planner-recipes', search || ''] as const),
}

/**
 * Hook to retrieve all planned meals for a 7-day week range.
 */
export function useMealPlanWeek(startDate: string, endDate: string) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId),
    queryFn: () => fetchMealPlanForWeek(startDate, endDate),
    enabled: Boolean(userId && startDate && endDate),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to retrieve recipes for the Add Meal bottom sheet.
 */
export function useRecipesForMealPicker(search?: string) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: MEAL_PLAN_KEYS.picker(search, userId),
    queryFn: () => fetchRecipesForPicker(search),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Mutation to add a planned meal entry.
 */
export function useAddMealPlanItem(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (input: AddMealPlanItemInput) => addMealPlanItem(input),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
        queryClient.invalidateQueries({ queryKey: ['meal-plan-week'] })
      }
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
    },
  })
}

/**
 * Mutation to update an existing planned meal item.
 */
export function useUpdateMealPlanItem(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (input: UpdateMealPlanItemInput) => updateMealPlanItem(input),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
        queryClient.invalidateQueries({ queryKey: ['meal-plan-week'] })
      }
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
    },
  })
}

/**
 * Mutation to toggle the cooked state of a planned meal.
 */
export function useToggleMealCooked(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({ id, isCooked }: { id: string; isCooked: boolean }) =>
      toggleMealPlanItemCooked(id, isCooked),
    onMutate: async ({ id, isCooked }) => {
      if (!startDate || !endDate) return

      await queryClient.cancelQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId) })
      const prevData = queryClient.getQueryData<DayMeals[]>(MEAL_PLAN_KEYS.week(startDate, endDate, userId))

      if (prevData) {
        queryClient.setQueryData<DayMeals[]>(
          MEAL_PLAN_KEYS.week(startDate, endDate, userId),
          prevData.map((day) => ({
            ...day,
            slots: {
              breakfast: day.slots.breakfast.map((m) => (m.id === id ? { ...m, is_cooked: isCooked } : m)),
              lunch: day.slots.lunch.map((m) => (m.id === id ? { ...m, is_cooked: isCooked } : m)),
              dinner: day.slots.dinner.map((m) => (m.id === id ? { ...m, is_cooked: isCooked } : m)),
              snack: day.slots.snack.map((m) => (m.id === id ? { ...m, is_cooked: isCooked } : m)),
            },
          }))
        )
      }

      return { prevData }
    },
    onError: (_err, _vars, context) => {
      if (startDate && endDate && context?.prevData) {
        queryClient.setQueryData(MEAL_PLAN_KEYS.week(startDate, endDate, userId), context.prevData)
      }
    },
    onSettled: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId) })
      } else {
        queryClient.invalidateQueries({ queryKey: ['meal-plan-week'] })
      }
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
    },
  })
}

/**
 * Mutation to delete a planned meal item.
 */
export function useDeleteMealPlanItem(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (id: string) => deleteMealPlanItem(id),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate, userId) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
        queryClient.invalidateQueries({ queryKey: ['meal-plan-week'] })
      }
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
    },
  })
}
