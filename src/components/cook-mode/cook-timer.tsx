/**
 * Aurelia Mobile — Drift-Free Precision Step Timer
 *
 * Implements timestamp-anchored countdown to eliminate drift during
 * re-renders, app backgrounding, or OS throttling.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  AppState,
  type AppStateStatus,
} from 'react-native'
import { Play, Pause, RotateCcw, CheckCircle2, Timer } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { formatTimer } from '@/features/cook-mode/timer-utils'

interface CookTimerProps {
  durationSeconds: number
  stepNumber: number
  onComplete?: () => void
}

export function CookTimer({ durationSeconds, stepNumber, onComplete }: CookTimerProps) {
  const { colors, typography, radii, spacing, shadows } = useAureliaTheme()

  const [remaining, setRemaining] = useState(durationSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  const targetEndTimeRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef(durationSeconds)

  // Reset if parent step/duration changes
  useEffect(() => {
    durationRef.current = durationSeconds
    setRemaining(durationSeconds)
    setIsRunning(false)
    setIsFinished(false)
    targetEndTimeRef.current = null
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [durationSeconds, stepNumber])

  const handleFinish = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    targetEndTimeRef.current = null
    setIsRunning(false)
    setIsFinished(true)
    setRemaining(0)

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    onComplete?.()
  }, [onComplete])

  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    if (remaining <= 0) return

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setIsFinished(false)
    setIsRunning(true)

    const targetTime = Date.now() + remaining * 1000
    targetEndTimeRef.current = targetTime

    stopInterval()
    intervalRef.current = setInterval(() => {
      if (!targetEndTimeRef.current) return
      const now = Date.now()
      const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000))

      if (diffSeconds <= 0) {
        handleFinish()
      } else {
        setRemaining(diffSeconds)
      }
    }, 250)
  }, [remaining, handleFinish, stopInterval])

  const pauseTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    stopInterval()
    if (targetEndTimeRef.current) {
      const diff = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000))
      setRemaining(diff)
      targetEndTimeRef.current = null
    }
    setIsRunning(false)
  }, [stopInterval])

  const resetTimer = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    stopInterval()
    targetEndTimeRef.current = null
    setIsRunning(false)
    setIsFinished(false)
    setRemaining(durationRef.current)
  }, [stopInterval])

  // Lifecycle listener: handles app backgrounding / foregrounding without drift
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isRunning && targetEndTimeRef.current) {
        const now = Date.now()
        const diffSeconds = Math.max(0, Math.ceil((targetEndTimeRef.current - now) / 1000))

        if (diffSeconds <= 0) {
          handleFinish()
        } else {
          setRemaining(diffSeconds)
        }
      }
    }

    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => {
      sub.remove()
      stopInterval()
    }
  }, [isRunning, handleFinish, stopInterval])

  const progressRatio = durationSeconds > 0 ? (durationSeconds - remaining) / durationSeconds : 0
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRatio * 100)))

  return (
    <View
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: isFinished
            ? colors.primary + '12'
            : isRunning
              ? colors.primary + '08'
              : colors.card,
          borderColor: isFinished
            ? colors.primary
            : isRunning
              ? colors.primary + '50'
              : colors.border,
          borderRadius: radii.card,
        },
      ]}
      accessibilityRole="timer"
      accessibilityLabel={`Step timer: ${formatTimer(remaining)} remaining`}
    >
      {/* Header status */}
      <View style={styles.statusRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isFinished ? (
            <CheckCircle2 size={16} color={colors.primary} style={{ marginRight: 6 }} />
          ) : (
            <Timer size={16} color={isRunning ? colors.primary : colors.mutedForeground} style={{ marginRight: 6 }} />
          )}
          <Text
            style={[
              typography.caption,
              {
                color: isFinished
                  ? colors.primary
                  : isRunning
                    ? colors.primary
                    : colors.mutedForeground,
                fontWeight: '700',
                letterSpacing: 0.5,
              },
            ]}
          >
            {isFinished
              ? 'STEP TIMER COMPLETED'
              : isRunning
                ? 'TIMER COUNTING DOWN'
                : remaining < durationSeconds
                  ? 'TIMER PAUSED'
                  : 'RECOMMENDED STEP TIMER'}
          </Text>
        </View>

        <Text style={[typography.caption, { color: colors.mutedForeground }]}>
          {formatTimer(durationSeconds)} total
        </Text>
      </View>

      {/* Big Countdown Display */}
      <View style={styles.countdownRow}>
        <Text
          style={[
            styles.countdownText,
            {
              color: isFinished ? colors.primary : colors.foreground,
              fontVariant: ['tabular-nums'],
            },
          ]}
        >
          {formatTimer(remaining)}
        </Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border + '60' }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progressPercent}%`,
              backgroundColor: isFinished ? colors.primary : colors.primary,
            },
          ]}
        />
      </View>

      {/* Interactive Control Buttons */}
      <View style={styles.controlsRow}>
        <Pressable
          testID="reset-timer-btn"
          onPress={resetTimer}
          style={({ pressed }) => [
            styles.resetButton,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
              borderRadius: radii.control,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Reset timer"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <RotateCcw size={18} color={colors.foreground} />
          <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600', marginLeft: 6 }]}>
            Reset
          </Text>
        </Pressable>

        <Pressable
          testID="start-timer-btn"
          onPress={isRunning ? pauseTimer : startTimer}
          style={({ pressed }) => [
            styles.mainButton,
            {
              backgroundColor: isFinished ? colors.secondary : colors.primary,
              borderColor: isFinished ? colors.border : colors.primary,
              borderRadius: radii.control,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause countdown' : 'Start countdown'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isRunning ? (
            <>
              <Pause size={18} color={colors.primaryForeground} />
              <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700', marginLeft: 8 }]}>
                Pause Timer
              </Text>
            </>
          ) : (
            <>
              <Play size={18} color={isFinished ? colors.foreground : colors.primaryForeground} fill={isFinished ? colors.foreground : colors.primaryForeground} />
              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: isFinished ? colors.foreground : colors.primaryForeground,
                    fontWeight: '700',
                    marginLeft: 8,
                  },
                ]}
              >
                {isFinished ? 'Restart Timer' : remaining < durationSeconds ? 'Resume Timer' : 'Start Timer'}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    marginVertical: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  countdownRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  countdownText: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '800',
    letterSpacing: -1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    minHeight: 48,
    minWidth: 90,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  mainButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 20,
  },
})
