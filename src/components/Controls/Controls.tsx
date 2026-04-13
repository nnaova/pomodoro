// src/components/Controls/Controls.tsx
import styles from './Controls.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

export function Controls() {
  const { isRunning, phase, start, pause, stop, advancePhase } = usePomodoroStore()
  const isIdle = phase === 'idle'

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
