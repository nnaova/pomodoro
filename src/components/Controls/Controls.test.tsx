// src/components/Controls/Controls.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Controls } from './Controls'

beforeEach(() => {
  usePomodoroStore.setState({
    phase: 'idle', isRunning: false, timeLeft: 25 * 60,
    currentCycle: 0, completedCycles: 0,
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
  })
})

describe('Controls', () => {
  it('affiche le bouton Start quand isRunning est false', () => {
    render(<Controls />)
    expect(screen.getByLabelText('Démarrer')).toBeInTheDocument()
  })

  it('affiche le bouton Pause quand isRunning est true', () => {
    usePomodoroStore.setState({ isRunning: true, phase: 'work' })
    render(<Controls />)
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('appelle start() au clic sur Démarrer', async () => {
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Démarrer'))
    expect(usePomodoroStore.getState().isRunning).toBe(true)
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('appelle pause() au clic sur Pause', async () => {
    usePomodoroStore.setState({ isRunning: true, phase: 'work' })
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Pause'))
    expect(usePomodoroStore.getState().isRunning).toBe(false)
  })

  it('désactive Stop et Skip quand phase est idle', () => {
    render(<Controls />)
    expect(screen.getByLabelText('Arrêter')).toBeDisabled()
    expect(screen.getByLabelText('Passer')).toBeDisabled()
  })

  it('appelle stop() au clic sur Arrêter', async () => {
    usePomodoroStore.setState({ phase: 'work', isRunning: true })
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Arrêter'))
    expect(usePomodoroStore.getState().phase).toBe('idle')
  })
})
