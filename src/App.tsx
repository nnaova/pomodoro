// src/App.tsx
import { useState, useEffect } from 'react'
import { usePomodoroStore } from './store/pomodoroStore'
import { useTimer } from './hooks/useTimer'
import { Timer } from './components/Timer/Timer'
import { Controls } from './components/Controls/Controls'
import { CycleIndicator } from './components/CycleIndicator/CycleIndicator'
import { Header } from './components/Header/Header'
import { Settings } from './components/Settings/Settings'
import { TaskList } from './components/TaskList/TaskList'
import styles from './App.module.css'

const PHASE_LABEL: Record<string, string> = {
  work: 'Travail',
  shortBreak: 'Pause courte',
  longBreak: 'Pause longue',
}

export default function App() {
  const theme = usePomodoroStore((s) => s.theme)
  const isRunning = usePomodoroStore((s) => s.isRunning)
  const timeLeft = usePomodoroStore((s) => s.timeLeft)
  const phase = usePomodoroStore((s) => s.phase)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useTimer()

  useEffect(() => {
    if (typeof Notification === 'undefined') return
    const { notificationsEnabled, updateSettings } = usePomodoroStore.getState()
    if (notificationsEnabled && Notification.permission !== 'granted') {
      updateSettings({ notificationsEnabled: false })
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    if (isRunning && phase !== 'idle') {
      const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
      const ss = String(timeLeft % 60).padStart(2, '0')
      document.title = `${mm}:${ss} — ${PHASE_LABEL[phase] ?? phase}`
    } else {
      document.title = 'Pomodoro'
    }
  }, [isRunning, timeLeft, phase])

  return (
    <div className={styles.app}>
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className={styles.main}>
        <div className={styles.timerZone}>
          <Timer />
          <CycleIndicator />
          <Controls />
        </div>
        <div className={styles.taskZone}>
          <TaskList />
        </div>
      </main>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
