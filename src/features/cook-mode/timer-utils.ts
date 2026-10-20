/**
 * Aurelia Mobile — Cook Mode Timer Utilities & Natural Language Duration Parser
 */

/**
 * Extract cooking duration in seconds from instruction text.
 * Adapts proven web Cook Mode extraction regex:
 * Matches patterns like:
 * - "cook for 15 minutes"
 * - "bake for 25 min"
 * - "10 minute timer"
 * - "simmer 8-10 minutes"
 * - "rest for 30 seconds"
 * - "roast for 1.5 hours"
 */
export function extractTimerDuration(instruction: string | null | undefined): number | null {
  if (!instruction) return null

  const match = instruction.match(
    /(\d+(?:\.\d+)?)(?:\s*(?:-|to)\s*(\d+(?:\.\d+)?))?\s*(min(?:ute)?s?|sec(?:ond)?s?|hr|hour|hours)/i
  )
  if (!match) return null

  // Use the upper bound for ranges like "8-10 minutes" (10 minutes)
  const num = parseFloat(match[2] ?? match[1])
  if (isNaN(num) || num <= 0) return null

  const unit = match[3].toLowerCase()

  if (unit.startsWith('sec')) {
    return Math.round(num)
  }
  if (unit.startsWith('hr') || unit.startsWith('hour')) {
    return Math.round(num * 3600)
  }
  return Math.round(num * 60)
}

/**
 * Format total remaining seconds into MM:SS or HH:MM:SS.
 */
export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Calculate elapsed real time between start and completion ISO strings.
 */
export function formatElapsedCookingTime(startedAtIso: string, completedAtIso: string): string {
  try {
    const start = new Date(startedAtIso).getTime()
    const end = new Date(completedAtIso).getTime()
    const diffMs = Math.max(0, end - start)
    const diffMinutes = Math.round(diffMs / 60000)

    if (diffMinutes < 1) return 'less than a minute'
    if (diffMinutes === 1) return '1 minute'
    if (diffMinutes < 60) return `${diffMinutes} minutes`

    const hours = Math.floor(diffMinutes / 60)
    const remainingMins = diffMinutes % 60
    if (remainingMins === 0) return `${hours} hr`
    return `${hours} hr ${remainingMins} min`
  } catch {
    return 'several minutes'
  }
}
