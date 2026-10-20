/**
 * Aurelia Mobile — TanStack Query Hooks for Meal Planner
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  week: (start: string, end: string) => ['meal-plan-week', start, end] as const,
  picker: (search?: string) => ['meal-planner-recipes', search || ''] as const,
}

/**
 * Hook to retrieve all planned meals for a 7-day week range.
 */
export function useMealPlanWeek(startDate: string, endDate: string) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.week(startDate, endDate),
    queryFn: () => fetchMealPlanForWeek(startDate, endDate),
    enabled: Boolean(startDate && endDate),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to retrieve recipes for the Add Meal bottom sheet.
 */
export function useRecipesForMealPicker(search?: string) {
  return useQuery({
    queryKey: MEAL_PLAN_KEYS.picker(search),
    queryFn: () => fetchRecipesForPicker(search),
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Mutation to add a planned meal entry.
 */
export function useAddMealPlanItem(startDate?: string, endDate?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: AddMealPlanItemInput) => addMealPlanItem(input),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
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

  return useMutation({
    mutationFn: (input: UpdateMealPlanItemInput) => updateMealPlanItem(input),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
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

  return useMutation({
    mutationFn: ({ id, isCooked }: { id: string; isCooked: boolean }) =>
      toggleMealPlanItemCooked(id, isCooked),
    onMutate: async ({ id, isCooked }) => {
      if (!startDate || !endDate) return

      await queryClient.cancelQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate) })
      const prevData = queryClient.getQueryData<DayMeals[]>(MEAL_PLAN_KEYS.week(startDate, endDate))

      if (prevData) {
        queryClient.setQueryData<DayMeals[]>(
          MEAL_PLAN_KEYS.week(startDate, endDate),
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
        queryClient.setQueryData(MEAL_PLAN_KEYS.week(startDate, endDate), context.prevData)
      }
    },
    onSettled: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate) })
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

  return useMutation({
    mutationFn: (id: string) => deleteMealPlanItem(id),
    onSuccess: () => {
      if (startDate && endDate) {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.week(startDate, endDate) })
      } else {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_KEYS.all })
      }
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
    },
  })
}
