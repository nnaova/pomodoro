// src/store/pomodoroStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Phase = 'idle' | 'work' | 'shortBreak' | 'longBreak'
export type Theme = 'dark' | 'light'

export interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  cyclesBeforeLongBreak: number
  soundEnabled: boolean
  notificationsEnabled: boolean
  theme: Theme
}

export interface Session {
  phase: Phase
  timeLeft: number        // secondes
  currentCycle: number    // 0-based, reset à 0 après longue pause
  completedCycles: number // total depuis démarrage
  isRunning: boolean
}

interface Actions {
  start: () => void
  pause: () => void
  stop: () => void
  decrementTime: () => void
  advancePhase: () => void
  updateSettings: (s: Partial<Settings>) => void
}

export type PomodoroStore = Settings & Session & Actions

const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark',
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      phase: 'idle' as Phase,
      timeLeft: DEFAULT_SETTINGS.workDuration * 60,
      currentCycle: 0,
      completedCycles: 0,
      isRunning: false,

      start: () => {
        const { phase, workDuration } = get()
        if (phase === 'idle') {
          set({ phase: 'work', timeLeft: workDuration * 60, isRunning: true })
        } else {
          set({ isRunning: true })
        }
      },

      pause: () => set({ isRunning: false }),

      stop: () => {
        const { workDuration } = get()
        set({
          phase: 'idle',
          timeLeft: workDuration * 60,
          currentCycle: 0,
          completedCycles: 0,
          isRunning: false,
        })
      },

      decrementTime: () => set((s) => ({ timeLeft: s.timeLeft - 1 })),

      advancePhase: () => {
        const {
          phase, currentCycle, completedCycles, cyclesBeforeLongBreak,
          workDuration, shortBreakDuration, longBreakDuration,
        } = get()

        let newPhase: Phase
        let newCurrentCycle = currentCycle
        let newCompletedCycles = completedCycles

        if (phase === 'work') {
          newCompletedCycles++
          newCurrentCycle++
          if (newCurrentCycle >= cyclesBeforeLongBreak) {
            newPhase = 'longBreak'
            newCurrentCycle = 0
          } else {
            newPhase = 'shortBreak'
          }
        } else {
          newPhase = 'work'
        }

        const durations: Record<Phase, number> = {
          idle: workDuration,
          work: workDuration,
          shortBreak: shortBreakDuration,
          longBreak: longBreakDuration,
        }

        set({
          phase: newPhase,
          timeLeft: durations[newPhase] * 60,
          currentCycle: newCurrentCycle,
          completedCycles: newCompletedCycles,
          isRunning: true,
        })
      },

      updateSettings: (newSettings) => {
        set(newSettings)
        const state = get()
        if (state.phase === 'idle') {
          set({ timeLeft: state.workDuration * 60 })
        }
      },
    }),
    {
      name: 'pomodoro-settings',
      partialize: (state) => ({
        workDuration: state.workDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        cyclesBeforeLongBreak: state.cyclesBeforeLongBreak,
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
        theme: state.theme,
      }),
    }
  )
)
