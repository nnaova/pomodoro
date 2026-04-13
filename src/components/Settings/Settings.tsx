// src/components/Settings/Settings.tsx
import { useState } from 'react'
import styles from './Settings.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

interface SettingsProps {
  onClose: () => void
}

const DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
}

export function Settings({ onClose }: SettingsProps) {
  const store = usePomodoroStore()
  const [values, setValues] = useState<Record<keyof typeof DEFAULTS, string>>({
    workDuration: String(store.workDuration),
    shortBreakDuration: String(store.shortBreakDuration),
    longBreakDuration: String(store.longBreakDuration),
    cyclesBeforeLongBreak: String(store.cyclesBeforeLongBreak),
  })

  const handleChange = (key: keyof typeof DEFAULTS) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [key]: e.target.value }))
    }

  const parseValue = (val: string, fallback: number) => {
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? fallback : Math.max(1, parsed)
  }

  const handleSave = () => {
    store.updateSettings({
      workDuration: parseValue(values.workDuration, DEFAULTS.workDuration),
      shortBreakDuration: parseValue(values.shortBreakDuration, DEFAULTS.shortBreakDuration),
      longBreakDuration: parseValue(values.longBreakDuration, DEFAULTS.longBreakDuration),
      cyclesBeforeLongBreak: parseValue(values.cyclesBeforeLongBreak, DEFAULTS.cyclesBeforeLongBreak),
    })
    onClose()
  }

  const handleReset = () =>
    setValues({
      workDuration: String(DEFAULTS.workDuration),
      shortBreakDuration: String(DEFAULTS.shortBreakDuration),
      longBreakDuration: String(DEFAULTS.longBreakDuration),
      cyclesBeforeLongBreak: String(DEFAULTS.cyclesBeforeLongBreak),
    })

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 id="settings-title" className={styles.title}>Paramètres</h2>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Travail (min)</span>
            <input
              type="number" min="1" max="120"
              value={values.workDuration}
              onChange={handleChange('workDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Pause courte (min)</span>
            <input
              type="number" min="1" max="60"
              value={values.shortBreakDuration}
              onChange={handleChange('shortBreakDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Pause longue (min)</span>
            <input
              type="number" min="1" max="120"
              value={values.longBreakDuration}
              onChange={handleChange('longBreakDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Cycles avant longue pause</span>
            <input
              type="number" min="1" max="10"
              value={values.cyclesBeforeLongBreak}
              onChange={handleChange('cyclesBeforeLongBreak')}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Valeurs par défaut
          </button>
          <div className={styles.rightActions}>
            <button className={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button className={styles.saveBtn} onClick={handleSave}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
