// src/components/TaskList/TaskList.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { TaskList } from './TaskList'

beforeEach(() => {
  usePomodoroStore.setState({ tasks: [] })
})

describe('TaskList', () => {
  it('affiche le lien "+ Ajouter une tâche" quand la liste est vide', () => {
    render(<TaskList />)
    expect(screen.getByText('+ Ajouter une tâche')).toBeInTheDocument()
  })

  it('affiche un input au clic sur "+ Ajouter une tâche"', () => {
    render(<TaskList />)
    fireEvent.click(screen.getByText('+ Ajouter une tâche'))
    expect(screen.getByPlaceholderText('Nouvelle tâche…')).toBeInTheDocument()
  })

  it('ajoute une tâche sur la touche Entrée', () => {
    render(<TaskList />)
    fireEvent.click(screen.getByText('+ Ajouter une tâche'))
    const input = screen.getByPlaceholderText('Nouvelle tâche…')
    fireEvent.change(input, { target: { value: 'Ma première tâche' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(screen.getByText('Ma première tâche')).toBeInTheDocument()
  })

  it('n\'ajoute pas de tâche si le champ est vide', () => {
    render(<TaskList />)
    fireEvent.click(screen.getByText('+ Ajouter une tâche'))
    const input = screen.getByPlaceholderText('Nouvelle tâche…')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(usePomodoroStore.getState().tasks).toHaveLength(0)
  })

  it('n\'affiche pas l\'accordéon quand aucune tâche n\'est terminée', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Active', done: false, createdAt: 0 }],
    })
    render(<TaskList />)
    expect(screen.queryByText(/terminée/)).toBeNull()
  })

  it('affiche le compteur "1 terminée" quand une tâche est terminée', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    expect(screen.getByText(/1 terminée/)).toBeInTheDocument()
  })

  it('affiche "2 terminées" pour le pluriel', () => {
    usePomodoroStore.setState({
      tasks: [
        { id: '1', title: 'A', done: true, createdAt: 0 },
        { id: '2', title: 'B', done: true, createdAt: 1 },
      ],
    })
    render(<TaskList />)
    expect(screen.getByText(/2 terminées/)).toBeInTheDocument()
  })

  it('déplie l\'accordéon et affiche les tâches terminées au clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    expect(screen.getByText('Tâche finie')).toBeInTheDocument()
  })

  it('replie l\'accordéon au deuxième clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    expect(screen.queryByText('Tâche finie')).toBeNull()
  })

  it('affiche les tâches actives sans les terminées', () => {
    usePomodoroStore.setState({
      tasks: [
        { id: '1', title: 'Active', done: false, createdAt: 0 },
        { id: '2', title: 'Finie', done: true, createdAt: 1 },
      ],
    })
    render(<TaskList />)
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.queryByText('Finie')).toBeNull()
  })

  it('ajoute une tâche sur perte de focus (blur)', () => {
    render(<TaskList />)
    fireEvent.click(screen.getByText('+ Ajouter une tâche'))
    const input = screen.getByPlaceholderText('Nouvelle tâche…')
    fireEvent.change(input, { target: { value: 'Tâche via blur' } })
    fireEvent.blur(input)
    expect(screen.getByText('Tâche via blur')).toBeInTheDocument()
  })

  it('décocher une tâche terminée la remet dans les actives', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    // accordion is open, now uncheck the done task
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    // task should now be active, accordion should be gone
    expect(screen.queryByText(/terminée/)).toBeNull()
    expect(screen.getByText('Tâche finie')).toBeInTheDocument()
  })

  it('supprime une tâche active en cliquant sur ✕', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche à supprimer', done: false, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(usePomodoroStore.getState().tasks).toHaveLength(0)
  })

  it('supprime une tâche terminée depuis l\'accordéon en cliquant sur ✕', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(usePomodoroStore.getState().tasks).toHaveLength(0)
    expect(screen.queryByText(/terminée/)).toBeNull()
  })

  it('supprime toutes les tâches terminées après confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    usePomodoroStore.setState({
      tasks: [
        { id: '1', title: 'Active', done: false, createdAt: 0 },
        { id: '2', title: 'Finie', done: true, createdAt: 1 },
      ],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: 'Tout supprimer' }))
    expect(window.confirm).toHaveBeenCalledWith('Supprimer toutes les tâches terminées ?')
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
    expect(usePomodoroStore.getState().tasks[0].title).toBe('Active')
    vi.restoreAllMocks()
  })

  it('ne supprime pas si l\'utilisateur annule la confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    usePomodoroStore.setState({
      tasks: [{ id: '2', title: 'Finie', done: true, createdAt: 1 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: 'Tout supprimer' }))
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
    vi.restoreAllMocks()
  })
})
