// src/components/Controls/Controls.tsx
import styles from './Controls.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

export function Controls() {
  const { isRunning, phase, start, pause, stop, advancePhase } = usePomodoroStore()
  const isIdle = phase === 'idle'

  const phaseColor =
    phase === 'shortBreak' ? 'var(--color-short-break)' :
    phase === 'longBreak' ? 'var(--color-long-break)' :
    'var(--color-work)'

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.btn} ${styles.secondary}`}
        onClick={stop}
        disabled={isIdle}
        aria-label="Arrêter"
      >
        ■
      </button>
      <button
        className={`${styles.btn} ${styles.primary}`}
        onClick={isRunning ? pause : start}
        aria-label={isRunning ? 'Pause' : 'Démarrer'}
        style={{ background: phaseColor }}
      >
        {isRunning ? '⏸' : '▶'}
      </button>
      <button
        className={`${styles.btn} ${styles.secondary}`}
        onClick={() => advancePhase()}
        disabled={isIdle}
        aria-label="Passer"
      >
        ⏭
      </button>
    </div>
  )
}
