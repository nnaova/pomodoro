// src/store/pomodoroStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Phase = 'idle' | 'work' | 'shortBreak' | 'longBreak'
export type Theme = 'dark' | 'light'

export interface Task {
  id: string
  title: string
  done: boolean
  createdAt: number
}

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
  endTimestamp: number | null // timestamp (ms) de fin de la phase courante
}

export interface Actions {
  start: () => void
  pause: () => void
  stop: () => void
  decrementTime: () => void
  setTimeLeft: (t: number) => void
  advancePhase: () => void
  updateSettings: (s: Partial<Settings>) => void
  addTask: (title: string) => void
  toggleTask: (id: string) => void
  reorderTasks: (activeId: string, overId: string) => void
}

export type PomodoroStore = Settings & Session & { tasks: Task[] } & Actions

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
      endTimestamp: null,
      tasks: [] as Task[],

      addTask: (title) => {
        const task: Task = {
          id: crypto.randomUUID(),
          title,
          done: false,
          createdAt: Date.now(),
        }
        set((s) => ({ tasks: [...s.tasks, task] }))
      },

      toggleTask: (id) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        }))
      },

      reorderTasks: (activeId, overId) => {
        set((s) => {
          const from = s.tasks.findIndex((t) => t.id === activeId)
          const to = s.tasks.findIndex((t) => t.id === overId)
          if (from === -1 || to === -1) return s
          const tasks = s.tasks.slice()
          tasks.splice(to, 0, tasks.splice(from, 1)[0])
          return { tasks }
        })
      },

      start: () => {
        const { phase, workDuration, timeLeft } = get()
        if (phase === 'idle') {
          const duration = workDuration * 60
          set({ phase: 'work', timeLeft: duration, isRunning: true, endTimestamp: Date.now() + duration * 1000 })
        } else {
          set({ isRunning: true, endTimestamp: Date.now() + timeLeft * 1000 })
        }
      },

      pause: () => {
        const { endTimestamp, timeLeft } = get()
        const remaining = endTimestamp
          ? Math.max(0, Math.ceil((endTimestamp - Date.now()) / 1000))
          : timeLeft
        set({ isRunning: false, timeLeft: remaining, endTimestamp: null })
      },

      stop: () => {
        const { workDuration } = get()
        set({
          phase: 'idle',
          timeLeft: workDuration * 60,
          currentCycle: 0,
          completedCycles: 0,
          isRunning: false,
          endTimestamp: null,
        })
      },

      decrementTime: () => set((s) => ({ timeLeft: Math.max(0, s.timeLeft - 1) })),

      setTimeLeft: (t: number) => set({ timeLeft: t }),

      advancePhase: () => {
        const { phase } = get()
        if (phase === 'idle') return
        const {
          currentCycle, completedCycles, cyclesBeforeLongBreak,
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

        const newDuration = durations[newPhase] * 60
        set({
          phase: newPhase,
          timeLeft: newDuration,
          currentCycle: newCurrentCycle,
          completedCycles: newCompletedCycles,
          isRunning: true,
          endTimestamp: Date.now() + newDuration * 1000,
        })
      },

      updateSettings: (newSettings) => {
        const state = get()
        const updates: Partial<PomodoroStore> = { ...newSettings }
        if (state.phase === 'idle') {
          const newWorkDuration = 'workDuration' in newSettings
            ? (newSettings as { workDuration?: number }).workDuration ?? state.workDuration
            : state.workDuration
          updates.timeLeft = newWorkDuration * 60
        }
        set(updates)
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
        tasks: state.tasks,
      }),
    }
  )
)
