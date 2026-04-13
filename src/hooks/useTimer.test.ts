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
    usePomodoroStore.setState({ phase: 'work', isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60 - 3)
  })

  it('appelle playPhaseEndSound et advancePhase quand timeLeft atteint 0', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 1, isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(playPhaseEndSound).toHaveBeenCalledWith('work')
    expect(usePomodoroStore.getState().phase).toBe('shortBreak')
  })

  it('appelle sendPhaseNotification si notificationsEnabled', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 1, isRunning: true, notificationsEnabled: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(sendPhaseNotification).toHaveBeenCalledWith('work')
  })

  it("n'appelle pas les notifications si désactivées", () => {
    usePomodoroStore.setState({
      phase: 'work', timeLeft: 1, isRunning: true,
      soundEnabled: false, notificationsEnabled: false,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(playPhaseEndSound).not.toHaveBeenCalled()
    expect(sendPhaseNotification).not.toHaveBeenCalled()
  })

  it('arrête de décrémenter si isRunning passe à false', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { usePomodoroStore.getState().pause() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(98)
  })
})
