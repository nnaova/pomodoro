// src/components/Settings/Settings.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Settings } from './Settings'

beforeEach(() => {
  usePomodoroStore.setState({
    workDuration: 25, shortBreakDuration: 5,
    longBreakDuration: 15, cyclesBeforeLongBreak: 4,
  })
})

describe('Settings', () => {
  it('affiche les valeurs actuelles dans les inputs', () => {
    render(<Settings onClose={vi.fn()} />)
    expect(screen.getByLabelText('Travail (min)')).toHaveValue(25)
    expect(screen.getByLabelText('Pause courte (min)')).toHaveValue(5)
  })

  it('enregistre les nouvelles valeurs au clic sur Enregistrer', async () => {
    const onClose = vi.fn()
    render(<Settings onClose={onClose} />)
    const input = screen.getByLabelText('Travail (min)')
    await userEvent.clear(input)
    await userEvent.type(input, '30')
    await userEvent.click(screen.getByText('Enregistrer'))
    expect(usePomodoroStore.getState().workDuration).toBe(30)
    expect(onClose).toHaveBeenCalled()
  })

  it('remet les valeurs par défaut au clic sur Valeurs par défaut', async () => {
    usePomodoroStore.setState({ workDuration: 45 })
    render(<Settings onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Valeurs par défaut'))
    expect(screen.getByLabelText('Travail (min)')).toHaveValue(25)
  })

  it('ferme au clic sur Annuler', async () => {
    const onClose = vi.fn()
    render(<Settings onClose={onClose} />)
    await userEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
  })
})
