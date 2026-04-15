# Task Deletion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre la suppression individuelle de toutes les tâches (actives et terminées) et la suppression groupée des tâches terminées avec confirmation.

**Architecture:** Deux nouvelles actions dans le store Zustand (`deleteTask`, `deleteAllDoneTasks`), un bouton ✕ sur chaque tâche, un bouton "Tout supprimer" dans le header de l'accordéon des tâches terminées. Le header de l'accordéon est restructuré en flex-row pour accueillir les deux boutons côte à côte.

**Tech Stack:** React 19, Zustand 5, Vitest 3, React Testing Library 16, CSS Modules.

---

## Fichiers touchés

- Modifier: `src/store/pomodoroStore.ts` — ajouter `deleteTask` et `deleteAllDoneTasks` dans `Actions`
- Modifier: `src/store/pomodoroStore.test.ts` — tests pour les deux nouvelles actions
- Modifier: `src/components/TaskList/TaskList.tsx` — bouton ✕ sur chaque tâche, restructuration du header accordéon, bouton "Tout supprimer"
- Modifier: `src/components/TaskList/TaskList.test.tsx` — tests UI, mise à jour des tests impactés par la restructuration
- Modifier: `src/components/TaskList/TaskList.module.css` — styles `.deleteBtn`, `.accordionHeaderRow`, `.deleteAllBtn`

---

## Task 1 : Action `deleteTask` dans le store

**Files:**
- Modify: `src/store/pomodoroStore.ts`
- Test: `src/store/pomodoroStore.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter à la fin de `src/store/pomodoroStore.test.ts` :

```typescript
describe('deleteTask', () => {
  it('supprime la tâche avec l\'id correspondant', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    const id = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().deleteTask(id)
    const { tasks } = usePomodoroStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('B')
  })

  it('ne modifie rien si l\'id est inconnu', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().deleteTask('inconnu')
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
  })
})
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
npm test -- --run src/store/pomodoroStore.test.ts
```

Attendu : FAIL — `deleteTask is not a function`

- [ ] **Step 3 : Ajouter `deleteTask` à l'interface `Actions`**

Dans `src/store/pomodoroStore.ts`, ligne 44, après `reorderTasks` :

```typescript
export interface Actions {
  start: () => void
  pause: () => void
  stop: () => void
  decrementTime: () => void
  setTimeLeft: (t: number) => void
  advancePhase: () => void
  updateSettings: (s: Partial<Settings>) => void
  addTask: (title: string) => void
  toggleTask: (id: string) => void
  reorderTasks: (activeId: string, overId: string) => void
  deleteTask: (id: string) => void
  deleteAllDoneTasks: () => void
}
```

- [ ] **Step 4 : Implémenter `deleteTask` dans le store**

Dans `src/store/pomodoroStore.ts`, après le bloc `reorderTasks` (autour de la ligne 96), ajouter :

```typescript
      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
      },

      deleteAllDoneTasks: () => {
        set((s) => ({ tasks: s.tasks.filter((t) => !t.done) }))
      },
```

Note : `deleteAllDoneTasks` est ajouté ici aussi car il est dans l'interface — son test viendra dans la tâche suivante.

- [ ] **Step 5 : Vérifier que les tests passent**

```bash
npm test -- --run src/store/pomodoroStore.test.ts
```

Attendu : tous les tests PASS

- [ ] **Step 6 : Commit**

```bash
git add src/store/pomodoroStore.ts src/store/pomodoroStore.test.ts
git commit -m "feat(store): add deleteTask and deleteAllDoneTasks actions"
```

---

## Task 2 : Tests pour `deleteAllDoneTasks`

**Files:**
- Test: `src/store/pomodoroStore.test.ts`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter à la fin de `src/store/pomodoroStore.test.ts` (après le bloc `deleteTask`) :

```typescript
describe('deleteAllDoneTasks', () => {
  it('supprime toutes les tâches terminées', () => {
    usePomodoroStore.getState().addTask('Active')
    usePomodoroStore.getState().addTask('Terminée')
    const doneId = usePomodoroStore.getState().tasks[1].id
    usePomodoroStore.getState().toggleTask(doneId)
    usePomodoroStore.getState().deleteAllDoneTasks()
    const { tasks } = usePomodoroStore.getState()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Active')
  })

  it('ne modifie rien si aucune tâche n\'est terminée', () => {
    usePomodoroStore.getState().addTask('Active')
    usePomodoroStore.getState().deleteAllDoneTasks()
    expect(usePomodoroStore.getState().tasks).toHaveLength(1)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests passent (l'implémentation existe déjà)**

```bash
npm test -- --run src/store/pomodoroStore.test.ts
```

Attendu : tous les tests PASS (l'action a déjà été implémentée dans la Task 1)

- [ ] **Step 3 : Commit**

```bash
git add src/store/pomodoroStore.test.ts
git commit -m "test(store): add tests for deleteAllDoneTasks"
```

---

## Task 3 : Bouton ✕ sur les tâches actives + CSS

**Files:**
- Modify: `src/components/TaskList/TaskList.tsx`
- Modify: `src/components/TaskList/TaskList.module.css`
- Test: `src/components/TaskList/TaskList.test.tsx`

- [ ] **Step 1 : Écrire le test qui échoue**

Ajouter dans `src/components/TaskList/TaskList.test.tsx`, dans le `describe('TaskList', ...)`, après les tests existants :

```typescript
  it('supprime une tâche active en cliquant sur ✕', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche à supprimer', done: false, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }))
    expect(usePomodoroStore.getState().tasks).toHaveLength(0)
  })
```

- [ ] **Step 2 : Vérifier que le test échoue**

```bash
npm test -- --run src/components/TaskList/TaskList.test.tsx
```

Attendu : FAIL — `Unable to find an accessible element with the role "button" and name "Supprimer"`

- [ ] **Step 3 : Ajouter le style `.deleteBtn` dans le CSS**

Ajouter à la fin de `src/components/TaskList/TaskList.module.css` :

```css
.deleteBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1;
  padding: 2px 4px;
  flex-shrink: 0;
  font-family: inherit;
  transition: color 0.15s ease;
}

.deleteBtn:hover {
  color: #e05252;
}
```

- [ ] **Step 4 : Ajouter le bouton ✕ dans `SortableTaskItem`**

Remplacer la fonction `SortableTaskItem` dans `src/components/TaskList/TaskList.tsx` :

```tsx
function SortableTaskItem({ task }: { task: Task }) {
  const toggleTask = usePomodoroStore((s) => s.toggleTask)
  const deleteTask = usePomodoroStore((s) => s.deleteTask)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={styles.taskItem}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        ⠿
      </span>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => toggleTask(task.id)}
        className={styles.checkbox}
        id={`task-${task.id}`}
      />
      <label htmlFor={`task-${task.id}`} className={styles.taskLabel}>
        {task.title}
      </label>
      <button
        className={styles.deleteBtn}
        onClick={() => deleteTask(task.id)}
        aria-label="Supprimer"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 5 : Vérifier que tous les tests passent**

```bash
npm test -- --run src/components/TaskList/TaskList.test.tsx
```

Attendu : tous les tests PASS

- [ ] **Step 6 : Commit**

```bash
git add src/components/TaskList/TaskList.tsx src/components/TaskList/TaskList.module.css src/components/TaskList/TaskList.test.tsx
git commit -m "feat(TaskList): add delete button on active tasks"
```

---

## Task 4 : Bouton ✕ sur les tâches terminées + "Tout supprimer" dans l'accordéon

**Files:**
- Modify: `src/components/TaskList/TaskList.tsx`
- Modify: `src/components/TaskList/TaskList.module.css`
- Test: `src/components/TaskList/TaskList.test.tsx`

- [ ] **Step 1 : Mettre à jour l'import vitest pour inclure `vi`**

Dans `src/components/TaskList/TaskList.test.tsx`, ligne 1, remplacer :

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
```

par :

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
```

- [ ] **Step 2 : Mettre à jour les tests de clic sur l'accordéon**

La restructuration du header (bouton toggle + bouton "Tout supprimer" côte à côte) rend `getByText(/1 terminée/)` ambigu pour les clics. Remplacer les trois tests concernés dans `src/components/TaskList/TaskList.test.tsx` :

Remplacer :
```typescript
  it('déplie l\'accordéon et affiche les tâches terminées au clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByText(/1 terminée/))
    expect(screen.getByText('Tâche finie')).toBeInTheDocument()
  })
```

Par :
```typescript
  it('déplie l\'accordéon et affiche les tâches terminées au clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    expect(screen.getByText('Tâche finie')).toBeInTheDocument()
  })
```

Remplacer :
```typescript
  it('replie l\'accordéon au deuxième clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByText(/1 terminée/))
    fireEvent.click(screen.getByText(/1 terminée/))
    expect(screen.queryByText('Tâche finie')).toBeNull()
  })
```

Par :
```typescript
  it('replie l\'accordéon au deuxième clic', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    fireEvent.click(screen.getByRole('button', { name: /terminée/ }))
    expect(screen.queryByText('Tâche finie')).toBeNull()
  })
```

Remplacer :
```typescript
  it('décocher une tâche terminée la remet dans les actives', () => {
    usePomodoroStore.setState({
      tasks: [{ id: '1', title: 'Tâche finie', done: true, createdAt: 0 }],
    })
    render(<TaskList />)
    fireEvent.click(screen.getByText(/1 terminée/))
    // accordion is open, now uncheck the done task
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    // task should now be active, accordion should be gone
    expect(screen.queryByText(/terminée/)).toBeNull()
    expect(screen.getByText('Tâche finie')).toBeInTheDocument()
  })
```

Par :
```typescript
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
```

- [ ] **Step 3 : Écrire les nouveaux tests**

Ajouter à la fin du `describe('TaskList', ...)` dans `src/components/TaskList/TaskList.test.tsx` :

```typescript
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
```

- [ ] **Step 4 : Vérifier que les nouveaux tests échouent**

```bash
npm test -- --run src/components/TaskList/TaskList.test.tsx
```

Attendu : FAIL sur les 3 nouveaux tests — les mises à jour des tests existants peuvent passer ou échouer selon si la restructuration est déjà faite.

- [ ] **Step 5 : Ajouter les styles du header accordion dans le CSS**

Ajouter à la fin de `src/components/TaskList/TaskList.module.css` :

```css
.accordionHeaderRow {
  display: flex;
  align-items: center;
}

.deleteAllBtn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  padding: 4px 6px;
  flex-shrink: 0;
  transition: color 0.15s ease;
}

.deleteAllBtn:hover {
  color: #e05252;
}
```

Modifier `.accordionHeader` existant — remplacer `width: 100%` par `flex: 1` :

```css
.accordionHeader {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-short-break);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 4px;
  font-family: inherit;
}
```

- [ ] **Step 6 : Restructurer `CompletedAccordion` dans `TaskList.tsx`**

Remplacer la fonction `CompletedAccordion` entière :

```tsx
function CompletedAccordion({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false)
  const toggleTask = usePomodoroStore((s) => s.toggleTask)
  const deleteTask = usePomodoroStore((s) => s.deleteTask)
  const deleteAllDoneTasks = usePomodoroStore((s) => s.deleteAllDoneTasks)

  if (tasks.length === 0) return null

  return (
    <div className={styles.accordion}>
      <div className={styles.accordionHeaderRow}>
        <button
          className={styles.accordionHeader}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <span className={styles.accordionArrow}>{open ? '▼' : '▶'}</span>
          {tasks.length} terminée{tasks.length > 1 ? 's' : ''}
        </button>
        <button
          className={styles.deleteAllBtn}
          onClick={() => {
            if (window.confirm('Supprimer toutes les tâches terminées ?')) {
              deleteAllDoneTasks()
            }
          }}
        >
          Tout supprimer
        </button>
      </div>
      {open && (
        <div className={styles.accordionBody}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <span className={styles.dragHandlePlaceholder} />
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className={styles.checkbox}
                id={`task-done-${task.id}`}
              />
              <label
                htmlFor={`task-done-${task.id}`}
                className={`${styles.taskLabel} ${styles.taskLabelDone}`}
              >
                {task.title}
              </label>
              <button
                className={styles.deleteBtn}
                onClick={() => deleteTask(task.id)}
                aria-label="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7 : Vérifier que tous les tests passent**

```bash
npm test -- --run src/components/TaskList/TaskList.test.tsx
```

Attendu : tous les tests PASS

- [ ] **Step 8 : Lancer la suite complète**

```bash
npm test -- --run
```

Attendu : tous les tests PASS

- [ ] **Step 9 : Commit**

```bash
git add src/components/TaskList/TaskList.tsx src/components/TaskList/TaskList.module.css src/components/TaskList/TaskList.test.tsx
git commit -m "feat(TaskList): add delete buttons on completed tasks and bulk delete"
```
