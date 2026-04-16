# Progress Bar & Timer Persistence — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une barre de progression manuelle (4 segments, 25/50/75/100%) sur chaque tâche active, et persister la session du minuteur dans localStorage pour survivre aux rafraîchissements.

**Architecture:** `Task` reçoit un champ `progress`, avec action `setTaskProgress` dans le store Zustand. `SortableTaskItem` affiche 4 segments cliquables sous le titre. La session complète est ajoutée au `partialize`, et `useTimer` ajoute un effet de montage pour rattraper les phases expirées.

**Tech Stack:** React, Zustand (persist middleware), TypeScript, Vitest + Testing Library

---

### Task 1 : Store — champ progress + action setTaskProgress

**Files:**
- Modify: `src/store/pomodoroStore.ts`
- Test: `src/store/pomodoroStore.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Dans `pomodoroStore.test.ts`, ajouter après le `describe('addTask')` existant :

```ts
it('addTask initialise progress à 0', () => {
  usePomodoroStore.getState().addTask('Nouvelle tâche')
  expect(usePomodoroStore.getState().tasks[0].progress).toBe(0)
})

describe('setTaskProgress', () => {
  it('met à jour le progress de la tâche ciblée', () => {
    usePomodoroStore.getState().addTask('Tâche A')
    const id = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().setTaskProgress(id, 75)
    expect(usePomodoroStore.getState().tasks[0].progress).toBe(75)
  })

  it('ne touche pas les autres tâches', () => {
    usePomodoroStore.getState().addTask('A')
    usePomodoroStore.getState().addTask('B')
    const idA = usePomodoroStore.getState().tasks[0].id
    usePomodoroStore.getState().setTaskProgress(idA, 50)
    expect(usePomodoroStore.getState().tasks[1].progress).toBe(0)
  })
})
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm test -- --run src/store/pomodoroStore.test.ts
```

Résultat attendu : FAIL — `setTaskProgress is not a function` / `progress` undefined.

- [ ] **Step 3 : Implémenter dans pomodoroStore.ts**

1. Mettre à jour l'interface `Task` :

```ts
export interface Task {
  id: string
  title: string
  done: boolean
  progress: 0 | 25 | 50 | 75 | 100
  createdAt: number
}
```

2. Ajouter `setTaskProgress` dans `Actions` :

```ts
setTaskProgress: (id: string, progress: Task['progress']) => void
```

3. Dans `addTask`, ajouter `progress: 0` :

```ts
addTask: (title) => {
  const task: Task = {
    id: crypto.randomUUID(),
    title,
    done: false,
    progress: 0,
    createdAt: Date.now(),
  }
  set((s) => ({ tasks: [...s.tasks, task] }))
},
```

4. Ajouter l'implémentation de `setTaskProgress` dans le store (après `deleteAllDoneTasks`) :

```ts
setTaskProgress: (id, progress) => {
  set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, progress } : t)),
  }))
},
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm test -- --run src/store/pomodoroStore.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/store/pomodoroStore.ts src/store/pomodoroStore.test.ts
git commit -m "feat(store): add progress field and setTaskProgress action to Task"
```

---

### Task 2 : Store — persister la session dans localStorage

**Files:**
- Modify: `src/store/pomodoroStore.ts`

- [ ] **Step 1 : Modifier partialize**

Dans `pomodoroStore.ts`, remplacer la fonction `partialize` existante par :

```ts
partialize: (state) => ({
  workDuration: state.workDuration,
  shortBreakDuration: state.shortBreakDuration,
  longBreakDuration: state.longBreakDuration,
  cyclesBeforeLongBreak: state.cyclesBeforeLongBreak,
  soundEnabled: state.soundEnabled,
  notificationsEnabled: state.notificationsEnabled,
  theme: state.theme,
  tasks: state.tasks,
  phase: state.phase,
  isRunning: state.isRunning,
  endTimestamp: state.endTimestamp,
  currentCycle: state.currentCycle,
  completedCycles: state.completedCycles,
}),
```

- [ ] **Step 2 : Lancer tous les tests pour vérifier l'absence de régression**

```bash
pnpm test -- --run
```

Résultat attendu : tous PASS.

- [ ] **Step 3 : Commit**

```bash
git add src/store/pomodoroStore.ts
git commit -m "feat(store): persist session state (phase, timer, cycles) in localStorage"
```

---

### Task 3 : useTimer — rattrapage de phase au montage

**Files:**
- Modify: `src/hooks/useTimer.ts`
- Test: `src/hooks/useTimer.test.ts`

- [ ] **Step 1 : Écrire les tests qui échouent**

Dans `useTimer.test.ts`, ajouter dans le `describe('useTimer')` :

```ts
it('avance la phase au montage si endTimestamp est déjà dépassé', () => {
  usePomodoroStore.setState({
    phase: 'work',
    timeLeft: 1,
    isRunning: true,
    currentCycle: 0,
    completedCycles: 0,
    endTimestamp: Date.now() - 5000,
  })
  act(() => {
    renderHook(() => useTimer())
  })
  expect(usePomodoroStore.getState().phase).toBe('shortBreak')
})

it("ne fait pas de rattrapage si endTimestamp n'est pas expiré", () => {
  usePomodoroStore.setState({
    phase: 'work',
    timeLeft: 100,
    isRunning: true,
    endTimestamp: Date.now() + 100 * 1000,
  })
  act(() => {
    renderHook(() => useTimer())
  })
  expect(usePomodoroStore.getState().phase).toBe('work')
})
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm test -- --run src/hooks/useTimer.test.ts
```

Résultat attendu : le premier test FAIL (phase reste `work`).

- [ ] **Step 3 : Implémenter dans useTimer.ts**

Ajouter un `useEffect` de montage **avant** l'effet existant (sans dépendances sur `isRunning`) :

```ts
// Rattrapage au montage : si le timer tournait et la phase est déjà expirée
useEffect(() => {
  const state = usePomodoroStore.getState()
  if (state.isRunning && state.endTimestamp !== null && state.endTimestamp <= Date.now()) {
    state.advancePhase()
  }
}, [])
```

- [ ] **Step 4 : Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm test -- --run src/hooks/useTimer.test.ts
```

Résultat attendu : tous PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/hooks/useTimer.ts src/hooks/useTimer.test.ts
git commit -m "feat(timer): catch up expired phase on mount after page reload"
```

---

### Task 4 : UI — barre de progression dans SortableTaskItem

**Files:**
- Modify: `src/components/TaskList/TaskList.tsx`
- Modify: `src/components/TaskList/TaskList.module.css`
- Test: `src/components/TaskList/TaskList.test.tsx`

- [ ] **Step 1 : Mettre à jour les fixtures de test (TypeScript exige progress)**

Dans `TaskList.test.tsx`, ajouter `progress: 0` à tous les objets Task littéraux. Les 9 occurrences à modifier :

```ts
// Chercher : { id: '...', title: '...', done: ..., createdAt: ... }
// Remplacer par la même chose avec progress: 0 ajouté, ex :
{ id: '1', title: 'Active', done: false, progress: 0, createdAt: 0 }
{ id: '1', title: 'Tâche finie', done: true, progress: 0, createdAt: 0 }
{ id: '1', title: 'Tâche à supprimer', done: false, progress: 0, createdAt: 0 }
{ id: '1', title: 'Tâche via blur', done: false, progress: 0, createdAt: 0 }
// etc. — tous les objets Task dans ce fichier
```

- [ ] **Step 2 : Écrire les tests de la barre de progression**

Ajouter dans le `describe('TaskList')` de `TaskList.test.tsx` :

```ts
it('affiche 4 segments de progression pour une tâche active', () => {
  usePomodoroStore.setState({
    tasks: [{ id: '1', title: 'Tâche', done: false, progress: 0, createdAt: 0 }],
  })
  render(<TaskList />)
  expect(screen.getAllByRole('button', { name: /Progression/ })).toHaveLength(4)
})

it('cliquer le segment 50% quand progress=0 met progress à 50', () => {
  usePomodoroStore.setState({
    tasks: [{ id: '1', title: 'Tâche', done: false, progress: 0, createdAt: 0 }],
  })
  render(<TaskList />)
  fireEvent.click(screen.getByRole('button', { name: 'Progression 50%' }))
  expect(usePomodoroStore.getState().tasks[0].progress).toBe(50)
})

it('cliquer le segment actif repasse à l\'étape précédente', () => {
  usePomodoroStore.setState({
    tasks: [{ id: '1', title: 'Tâche', done: false, progress: 50, createdAt: 0 }],
  })
  render(<TaskList />)
  fireEvent.click(screen.getByRole('button', { name: 'Progression 50%' }))
  expect(usePomodoroStore.getState().tasks[0].progress).toBe(25)
})

it('cliquer 25% quand progress=25 remet progress à 0', () => {
  usePomodoroStore.setState({
    tasks: [{ id: '1', title: 'Tâche', done: false, progress: 25, createdAt: 0 }],
  })
  render(<TaskList />)
  fireEvent.click(screen.getByRole('button', { name: 'Progression 25%' }))
  expect(usePomodoroStore.getState().tasks[0].progress).toBe(0)
})

it("n'affiche pas la barre de progression dans l'accordéon terminé", () => {
  usePomodoroStore.setState({
    tasks: [{ id: '1', title: 'Finie', done: true, progress: 50, createdAt: 0 }],
  })
  render(<TaskList />)
  fireEvent.click(screen.getByRole('button', { name: /\d+ terminée/ }))
  expect(screen.queryByRole('button', { name: /Progression/ })).toBeNull()
})
```

- [ ] **Step 3 : Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm test -- --run src/components/TaskList/TaskList.test.tsx
```

Résultat attendu : les 5 nouveaux tests FAIL.

- [ ] **Step 4 : Implémenter dans TaskList.tsx**

Ajouter la constante des étapes après les imports :

```ts
const PROGRESS_STEPS: Array<25 | 50 | 75 | 100> = [25, 50, 75, 100]
```

Remplacer la fonction `SortableTaskItem` entière par :

```tsx
function SortableTaskItem({ task }: { task: Task }) {
  const toggleTask = usePomodoroStore((s) => s.toggleTask)
  const deleteTask = usePomodoroStore((s) => s.deleteTask)
  const setTaskProgress = usePomodoroStore((s) => s.setTaskProgress)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={styles.taskItem}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}>⠿</span>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => toggleTask(task.id)}
        className={styles.checkbox}
        id={`task-${task.id}`}
      />
      <div className={styles.taskContent}>
        <label htmlFor={`task-${task.id}`} className={styles.taskLabel}>
          {task.title}
        </label>
        <div className={styles.progressBar}>
          {PROGRESS_STEPS.map((step) => {
            const filled = task.progress >= step
            const idx = PROGRESS_STEPS.indexOf(step)
            const newProgress = (task.progress === step
              ? (PROGRESS_STEPS[idx - 1] ?? 0)
              : step) as Task['progress']
            return (
              <button
                key={step}
                className={`${styles.progressSegment}${filled ? ` ${styles.progressSegmentFilled}` : ''}`}
                onClick={() => setTaskProgress(task.id, newProgress)}
                aria-label={`Progression ${step}%`}
              />
            )
          })}
        </div>
      </div>
      <button className={styles.deleteBtn} onClick={() => deleteTask(task.id)} aria-label="Supprimer">
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 5 : Ajouter les styles dans TaskList.module.css**

Ajouter à la fin du fichier :

```css
.taskContent {
  flex: 1;
  min-width: 0;
}

.progressBar {
  display: flex;
  gap: 3px;
  margin-top: 5px;
  padding: 3px 0;
}

.progressSegment {
  height: 4px;
  flex: 1;
  border-radius: 2px;
  background: var(--surface-elevated);
  border: none;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.progressSegment:hover {
  opacity: 0.75;
}

.progressSegmentFilled {
  background: var(--color-work);
}
```

Modifier `.taskLabel` pour retirer `flex: 1` (maintenant porté par `.taskContent`) :

```css
.taskLabel {
  font-size: 14px;
  color: var(--text);
  cursor: pointer;
  display: block;
}
```

- [ ] **Step 6 : Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm test -- --run src/components/TaskList/TaskList.test.tsx
```

Résultat attendu : tous PASS.

- [ ] **Step 7 : Lancer la suite complète**

```bash
pnpm test -- --run
```

Résultat attendu : tous PASS.

- [ ] **Step 8 : Commit**

```bash
git add src/components/TaskList/TaskList.tsx src/components/TaskList/TaskList.module.css src/components/TaskList/TaskList.test.tsx
git commit -m "feat(tasks): add manual progress bar with 4 steps (25/50/75/100%)"
```
