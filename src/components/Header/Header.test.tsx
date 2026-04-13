import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Header } from './Header'

vi.mock('../../utils/notifications', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
}))

beforeEach(() => {
  usePomodoroStore.setState({
    soundEnabled: true, notificationsEnabled: true, theme: 'dark',
  })
})

describe('Header', () => {
  it('appelle onSettingsClick au clic sur le bouton paramètres', async () => {
    const onSettingsClick = vi.fn()
    render(<Header onSettingsClick={onSettingsClick} />)
    await userEvent.click(screen.getByLabelText('Paramètres'))
    expect(onSettingsClick).toHaveBeenCalled()
  })

  it('toggle le son', async () => {
    render(<Header onSettingsClick={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Couper le son'))
    expect(usePomodoroStore.getState().soundEnabled).toBe(false)
  })

  it('toggle le thème', async () => {
    render(<Header onSettingsClick={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Mode clair'))
    expect(usePomodoroStore.getState().theme).toBe('light')
  })
})
