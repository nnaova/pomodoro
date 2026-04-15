// src/store/pomodoroStore.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePomodoroStore, type Task } from './pomodoroStore'

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
  endTimestamp: null as number | null,
  tasks: [] as Task[],
}

beforeEach(() => {
  usePomodoroStore.setState(DEFAULTS)
})

describe('start', () => {
  it('passe de idle à work et démarre le timer', () => {
    const before = Date.now()
    usePomodoroStore.getState().start()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('work')
    expect(s.isRunning).toBe(true)
    expect(s.timeLeft).toBe(25 * 60)
    expect(s.endTimestamp).toBeGreaterThanOrEqual(before + 25 * 60 * 1000)
  })

  it('reprend un timer en pause sans réinitialiser timeLeft', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 600, isRunning: false })
    const before = Date.now()
    usePomodoroStore.getState().start()
    const s = usePomodoroStore.getState()
    expect(s.isRunning).toBe(true)
    expect(s.timeLeft).toBe(600)
    expect(s.endTimestamp).toBeGreaterThanOrEqual(before + 600 * 1000)
  })
})

describe('pause', () => {
  it('met isRunning à false', () => {
    usePomodoroStore.setState({ isRunning: true })
    usePomodoroStore.getState().pause()
    expect(usePomodoroStore.getState().isRunning).toBe(false)
  })

  it('calcule timeLeft depuis endTimestamp et efface endTimestamp', () => {
    vi.useFakeTimers()
    const endTimestamp = Date.now() + 50 * 1000
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, isRunning: true, endTimestamp })
    vi.advanceTimersByTime(10000) // 10s se sont écoulées
    usePomodoroStore.getState().pause()
    const s = usePomodoroStore.getState()
    expect(s.isRunning).toBe(false)
    expect(s.endTimestamp).toBeNull()
    expect(s.timeLeft).toBe(40) // 50s - 10s écoulées
    vi.useRealTimers()
  })
})

describe('stop', () => {
  it('réinitialise toute la session à idle', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, currentCycle: 2, completedCycles: 5, isRunning: true, endTimestamp: Date.now() + 100000 })
    usePomodoroStore.getState().stop()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('idle')
    expect(s.timeLeft).toBe(25 * 60)
    expect(s.currentCycle).toBe(0)
    expect(s.completedCycles).toBe(0)
    expect(s.isRunning).toBe(false)
    expect(s.endTimestamp).toBeNull()
  })
})

describe('decrementTime', () => {
  it('réduit timeLeft de 1', () => {
    usePomodoroStore.setState({ timeLeft: 100 })
    usePomodoroStore.getState().decrementTime()
    expect(usePomodoroStore.getState().timeLeft).toBe(99)
  })

  it('ne descend pas en dessous de 0', () => {
    usePomodoroStore.setState({ timeLeft: 0 })
    usePomodoroStore.getState().decrementTime()
    expect(usePomodoroStore.getState().timeLeft).toBe(0)
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
    const before = Date.now()
    usePomodoroStore.getState().advancePhase()
    const s = usePomodoroStore.getState()
    expect(s.timeLeft).toBe(5 * 60)
    expect(s.endTimestamp).toBeGreaterThanOrEqual(before + 5 * 60 * 1000)
  })

  it('ne fait rien si phase est idle', () => {
    usePomodoroStore.setState({ phase: 'idle' })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().phase).toBe('idle')
  })

  it('shortBreak → work ne modifie pas completedCycles', () => {
    usePomodoroStore.setState({ phase: 'shortBreak', completedCycles: 2 })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().completedCycles).toBe(2)
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

describe('addTask', () => {
  it('ajoute une tâche avec done: false et un id', () => {
    usePomodoroStore.getState().addTask('Écrire les tests')
    const { tasks } = usePomodoroStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Écrire les tests')
    expect(tasks[0].done).toBe(false)
    expect(typeof tasks[0].id).toBe('string')
  })

  it('ajoute plusieurs tâches dans l\'ordre', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    const titles = usePomodoroStore.getState().tasks.map((t) => t.title)
    expect(titles).toEqual(['A', 'B'])
  })
})

describe('toggleTask', () => {
  it('bascule done à true puis à false', () => {
    usePomodoroStore.getState().addTask('Tâche A')
    const id = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().toggleTask(id)
    expect(usePomodoroStore.getState().tasks[0].done).toBe(true)
    usePomodoroStore.getState().toggleTask(id)
    expect(usePomodoroStore.getState().tasks[0].done).toBe(false)
  })

  it('ne touche pas les autres tâches', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    const id = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().toggleTask(id)
    expect(usePomodoroStore.getState().tasks[1].done).toBe(false)
  })
})

describe('reorderTasks', () => {
  it('déplace une tâche à la position cible', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    usePomodoroStore.getState().addTask('C')
    const [a, , c] = usePomodoroStore.getState().tasks
    usePomodoroStore.getState().reorderTasks(c.id, a.id)
    const titles = usePomodoroStore.getState().tasks.map((t) => t.title)
    expect(titles).toEqual(['C', 'A', 'B'])
  })

  it('déplace une tâche vers le bas', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    usePomodoroStore.getState().addTask('C')
    const [a, , c] = usePomodoroStore.getState().tasks
    usePomodoroStore.getState().reorderTasks(a.id, c.id)
    const titles = usePomodoroStore.getState().tasks.map((t) => t.title)
    expect(titles).toEqual(['B', 'C', 'A'])
  })

  it('ne modifie rien si activeId ou overId est inconnu', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().reorderTasks('inconnu', 'aussi-inconnu')
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
  })
})

describe('deleteTask', () => {
  it('supprime la tâche avec l\'id correspondant', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    const id = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().deleteTask(id)
    const { tasks } = usePomodoroStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('B')
  })

  it('ne modifie rien si l\'id est inconnu', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().deleteTask('inconnu')
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
  })
})

describe('deleteAllDoneTasks', () => {
  it('supprime toutes les tâches terminées', () => {
    usePomodoroStore.getState().addTask('Active')
    usePomodoroStore.getState().addTask('Terminée')
    const doneId = usePomodoroStore.getState().tasks[1].id
    usePomodoroStore.getState().toggleTask(doneId)
    usePomodoroStore.getState().deleteAllDoneTasks()
    const { tasks } = usePomodoroStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Active')
  })

  it('ne modifie rien si aucune tâche n\'est terminée', () => {
    usePomodoroStore.getState().addTask('Active')
    usePomodoroStore.getState().deleteAllDoneTasks()
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
  })
})
