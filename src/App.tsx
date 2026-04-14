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

export default function App() {
  const theme = usePomodoroStore((s) => s.theme)
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

  return (
    <div className={styles.app}>
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className={styles.main}>
        <Timer />
        <CycleIndicator />
        <Controls />
        <TaskList />
      </main>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
