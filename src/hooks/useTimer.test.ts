import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { playPhaseEndSound, sendPhaseNotification } from '../utils/notifications'
import { useTimer } from './useTimer'

vi.mock('../utils/notifications', () => ({
  playPhaseEndSound: vi.fn(),
  sendPhaseNotification: vi.fn(),
}))

const DEFAULTS = {
  workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
  cyclesBeforeLongBreak: 4, soundEnabled: true, notificationsEnabled: true,
  theme: 'dark' as const, phase: 'idle' as const,
  timeLeft: 25 * 60, currentCycle: 0, completedCycles: 0, isRunning: false,
  endTimestamp: null as number | null,
}

beforeEach(() => {
  vi.useFakeTimers()
  usePomodoroStore.setState(DEFAULTS)
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it("ne décrémente pas si isRunning est false", () => {
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60)
  })

  it('décrémente timeLeft chaque seconde quand isRunning est true', () => {
    const timeLeft = 25 * 60
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft,
      isRunning: true,
      endTimestamp: Date.now() + timeLeft * 1000,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60 - 3)
  })

  it('appelle playPhaseEndSound et advancePhase quand timeLeft atteint 0', () => {
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft: 1,
      isRunning: true,
      endTimestamp: Date.now() + 1000,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(playPhaseEndSound).toHaveBeenCalledWith('work')
    expect(usePomodoroStore.getState().phase).toBe('shortBreak')
  })

  it('appelle sendPhaseNotification si notificationsEnabled', () => {
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft: 1,
      isRunning: true,
      notificationsEnabled: true,
      endTimestamp: Date.now() + 1000,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(sendPhaseNotification).toHaveBeenCalledWith('work')
  })

  it("n'appelle pas les notifications si désactivées", () => {
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft: 1,
      isRunning: true,
      soundEnabled: false,
      notificationsEnabled: false,
      endTimestamp: Date.now() + 1000,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    expect(playPhaseEndSound).not.toHaveBeenCalled()
    expect(sendPhaseNotification).not.toHaveBeenCalled()
  })

  it('arrête de décrémenter si isRunning passe à false', () => {
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft: 100,
      isRunning: true,
      endTimestamp: Date.now() + 100 * 1000,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { usePomodoroStore.getState().pause() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(98)
  })

  it('corrige le timer au retour sur l\'onglet via visibilitychange', () => {
    const timeLeft = 60
    usePomodoroStore.setState({
      phase: 'work',
      timeLeft,
      isRunning: true,
      endTimestamp: Date.now() + timeLeft * 1000,
    })
    renderHook(() => useTimer())

    // Simuler 10 secondes écoulées sans tick (onglet en arrière-plan)
    vi.advanceTimersByTime(10000)

    // Simuler le retour sur l'onglet
    Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(usePomodoroStore.getState().timeLeft).toBe(50)
  })
})
