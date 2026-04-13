// src/components/Timer/Timer.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Timer } from './Timer'

beforeEach(() => {
  usePomodoroStore.setState({
    phase: 'idle', timeLeft: 25 * 60,
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    currentCycle: 0, completedCycles: 0, isRunning: false,
  })
})

describe('Timer', () => {
  it('affiche le temps formaté MM:SS', () => {
    usePomodoroStore.setState({ timeLeft: 25 * 60 })
    render(<Timer />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('affiche 09:05 pour 545 secondes', () => {
    usePomodoroStore.setState({ timeLeft: 545 })
    render(<Timer />)
    expect(screen.getByText('09:05')).toBeInTheDocument()
  })

  it('affiche le label de phase work', () => {
    usePomodoroStore.setState({ phase: 'work' })
    render(<Timer />)
    expect(screen.getByText('Travail')).toBeInTheDocument()
  })

  it('affiche le label Pause courte', () => {
    usePomodoroStore.setState({ phase: 'shortBreak' })
    render(<Timer />)
    expect(screen.getByText('Pause courte')).toBeInTheDocument()
  })
})
