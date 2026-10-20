/**
 * Aurelia Mobile — Cook Mode Screen Wake-Lock Hook
 *
 * Prevents screen sleep while hands are busy cooking.
 * Re-acquires on app foregrounding and cleanly releases on unmount.
 */

import { useEffect, useState } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import * as KeepAwake from 'expo-keep-awake'

const TAG = 'aurelia-cook-mode-wakelock'

export function useCookWakeLock() {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function activate() {
      try {
        await KeepAwake.activateKeepAwakeAsync(TAG)
        if (isMounted) setIsWakeLockActive(true)
      } catch {
        if (isMounted) setIsWakeLockActive(false)
      }
    }

    activate()

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        activate()
      } else {
        KeepAwake.deactivateKeepAwake(TAG)
        if (isMounted) setIsWakeLockActive(false)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      isMounted = false
      subscription.remove()
      KeepAwake.deactivateKeepAwake(TAG)
      setIsWakeLockActive(false)
    }
  }, [])

  return { isWakeLockActive }
}
