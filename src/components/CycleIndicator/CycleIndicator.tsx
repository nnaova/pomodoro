// src/components/CycleIndicator/CycleIndicator.tsx
import styles from './CycleIndicator.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

export function CycleIndicator() {
  const { currentCycle, cyclesBeforeLongBreak } = usePomodoroStore()

  return (
    <div
      className={styles.dots}
      role="group"
      aria-label={`Cycle ${currentCycle} sur ${cyclesBeforeLongBreak}`}
    >
      {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
        <span
          key={i}
          className={`${styles.dot} ${i < currentCycle ? styles.filled : ''}`}
          data-filled={i < currentCycle}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
