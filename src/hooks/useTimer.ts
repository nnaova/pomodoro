import { useEffect } from 'react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { playPhaseEndSound, sendPhaseNotification } from '../utils/notifications'

export function useTimer(): void {
  const isRunning = usePomodoroStore((s) => s.isRunning)

  // Rattrapage au montage : si le timer tournait et la phase est déjà expirée
  useEffect(() => {
    const state = usePomodoroStore.getState()
    if (state.isRunning && state.endTimestamp !== null && state.endTimestamp <= Date.now()) {
      state.advancePhase()
    }
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const tick = () => {
      const state = usePomodoroStore.getState()
      if (!state.isRunning) return

      const { endTimestamp } = state
      if (endTimestamp === null) return

      const remaining = Math.ceil((endTimestamp - Date.now()) / 1000)

      if (remaining <= 0) {
        const { phase, soundEnabled, notificationsEnabled } = state
        if (soundEnabled) playPhaseEndSound(phase)
        if (notificationsEnabled) sendPhaseNotification(phase)
        state.advancePhase()
      } else {
        state.setTimeLeft(remaining)
      }
    }

    const interval = setInterval(tick, 1000)

    // Correction immédiate quand l'onglet redevient visible
    const handleVisibilityChange = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isRunning])
}
