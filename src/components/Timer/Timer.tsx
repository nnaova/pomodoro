// src/components/Timer/Timer.tsx
import styles from './Timer.module.css'
import { usePomodoroStore, Phase } from '../../store/pomodoroStore'

const RADIUS = 110
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PHASE_COLORS: Record<Phase, string> = {
  idle: 'var(--color-work)',
  work: 'var(--color-work)',
  shortBreak: 'var(--color-short-break)',
  longBreak: 'var(--color-long-break)',
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Prêt',
  work: 'Travail',
  shortBreak: 'Pause courte',
  longBreak: 'Pause longue',
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Timer() {
  const { phase, timeLeft, workDuration, shortBreakDuration, longBreakDuration } = usePomodoroStore()

  const durations: Record<Phase, number> = {
    idle: workDuration * 60,
    work: workDuration * 60,
    shortBreak: shortBreakDuration * 60,
    longBreak: longBreakDuration * 60,
  }

  const total = durations[phase]
  const progress = phase === 'idle' ? 0 : (total > 0 ? (total - timeLeft) / total : 0)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const color = PHASE_COLORS[phase]

  return (
    <div className={styles.container}>
      <svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        role="img"
        aria-label={`Timer: ${formatTime(timeLeft)}`}
      >
        <circle
          cx="130" cy="130" r={RADIUS}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth="10"
        />
        <circle
          cx="130" cy="130" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 130 130)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div className={styles.textOverlay}>
        <span className={styles.time}>{formatTime(timeLeft)}</span>
        <span className={styles.label}>{PHASE_LABELS[phase]}</span>
      </div>
    </div>
  )
}
