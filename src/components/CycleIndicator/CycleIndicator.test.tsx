// src/components/CycleIndicator/CycleIndicator.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { CycleIndicator } from './CycleIndicator'

beforeEach(() => {
  usePomodoroStore.setState({ currentCycle: 0, cyclesBeforeLongBreak: 4 })
})

describe('CycleIndicator', () => {
  it('affiche N dots égal à cyclesBeforeLongBreak', () => {
    render(<CycleIndicator />)
    const container = screen.getByRole('group')
    expect(container.children).toHaveLength(4)
  })

  it('marque 2 dots comme complétés quand currentCycle est 2', () => {
    usePomodoroStore.setState({ currentCycle: 2 })
    render(<CycleIndicator />)
    const dots = Array.from(screen.getByRole('group').children)
    expect(dots[0]).toHaveAttribute('data-filled', 'true')
    expect(dots[1]).toHaveAttribute('data-filled', 'true')
    expect(dots[2]).toHaveAttribute('data-filled', 'false')
  })
})
