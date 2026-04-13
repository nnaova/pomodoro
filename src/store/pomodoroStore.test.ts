// src/store/pomodoroStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePomodoroStore } from './pomodoroStore'

const DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark' as const,
  phase: 'idle' as const,
  timeLeft: 25 * 60,
  currentCycle: 0,
  completedCycles: 0,
  isRunning: false,
}

beforeEach(() => {
  usePomodoroStore.setState(DEFAULTS)
})

describe('start', () => {
  it('passe de idle à work et démarre le timer', () => {
    usePomodoroStore.getState().start()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('work')
    expect(s.isRunning).toBe(true)
    expect(s.timeLeft).toBe(25 * 60)
  })

  it('reprend un timer en pause sans réinitialiser timeLeft', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 600, isRunning: false })
    usePomodoroStore.getState().start()
    expect(usePomodoroStore.getState().isRunning).toBe(true)
    expect(usePomodoroStore.getState().timeLeft).toBe(600)
  })
})

describe('pause', () => {
  it('met isRunning à false', () => {
    usePomodoroStore.setState({ isRunning: true })
    usePomodoroStore.getState().pause()
    expect(usePomodoroStore.getState().isRunning).toBe(false)
  })
})

describe('stop', () => {
  it('réinitialise toute la session à idle', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, currentCycle: 2, completedCycles: 5, isRunning: true })
    usePomodoroStore.getState().stop()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('idle')
    expect(s.timeLeft).toBe(25 * 60)
    expect(s.currentCycle).toBe(0)
    expect(s.completedCycles).toBe(0)
    expect(s.isRunning).toBe(false)
  })
})

describe('decrementTime', () => {
  it('réduit timeLeft de 1', () => {
    usePomodoroStore.setState({ timeLeft: 100 })
    usePomodoroStore.getState().decrementTime()
    expect(usePomodoroStore.getState().timeLeft).toBe(99)
  })
})

describe('advancePhase', () => {
  it('work → shortBreak quand currentCycle < cyclesBeforeLongBreak', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 0, completedCycles: 0 })
    usePomodoroStore.getState().advancePhase()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('shortBreak')
    expect(s.completedCycles).toBe(1)
    expect(s.currentCycle).toBe(1)
    expect(s.isRunning).toBe(true)
  })

  it('work → longBreak quand currentCycle atteint cyclesBeforeLongBreak', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 3, completedCycles: 3, cyclesBeforeLongBreak: 4 })
    usePomodoroStore.getState().advancePhase()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('longBreak')
    expect(s.currentCycle).toBe(0)
    expect(s.completedCycles).toBe(4)
  })

  it('shortBreak → work', () => {
    usePomodoroStore.setState({ phase: 'shortBreak' })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('longBreak → work', () => {
    usePomodoroStore.setState({ phase: 'longBreak' })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('remet timeLeft à la durée de la nouvelle phase', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 0, shortBreakDuration: 5 })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60)
  })
})

describe('updateSettings', () => {
  it('met à jour les durées', () => {
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().workDuration).toBe(30)
  })

  it('met à jour timeLeft si phase est idle', () => {
    usePomodoroStore.setState({ phase: 'idle' })
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().timeLeft).toBe(30 * 60)
  })

  it('ne touche pas timeLeft si timer en cours', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 600 })
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().timeLeft).toBe(600)
  })
})
