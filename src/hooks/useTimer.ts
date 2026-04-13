import { useEffect } from 'react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { playPhaseEndSound, sendPhaseNotification } from '../utils/notifications'

export function useTimer(): void {
  const isRunning = usePomodoroStore((s) => s.isRunning)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const state = usePomodoroStore.getState()
      if (!state.isRunning) return

      if (state.timeLeft <= 0) {
        const { phase, soundEnabled, notificationsEnabled } = state
        if (soundEnabled) playPhaseEndSound(phase)
        if (notificationsEnabled) sendPhaseNotification(phase)
        state.advancePhase()
      } else {
        state.decrementTime()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])
}
