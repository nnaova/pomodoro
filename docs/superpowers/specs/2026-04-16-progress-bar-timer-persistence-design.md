# Progress Bar & Timer Persistence — Design Spec

**Date :** 2026-04-16
**Stack :** React + Vite + Zustand + localStorage

---

## Contexte

Deux améliorations indépendantes sur l'app Pomodoro existante :
1. Barre de progression manuelle par tâche (étapes 0/25/50/75/100%)
2. Persistance du minuteur en localStorage pour survivre aux rafraîchissements et fermetures d'onglet

---

## 1. Barre de progression des tâches

### Modèle de données

Ajout d'un champ `progress` sur l'interface `Task` :

```ts
interface Task {
  id: string
  title: string
  done: boolean
  progress: 0 | 25 | 50 | 75 | 100  // nouveau
  createdAt: number
}
```

Nouvelle action dans le store :

```ts
setTaskProgress: (id: string, progress: Task['progress']) => void
```

Les tâches existantes (sans le champ) sont migrées implicitement à `0` à la lecture.

### UI

Dans `SortableTaskItem`, une rangée de 5 segments sous le titre de la tâche :

- 5 segments représentant 0%, 25%, 50%, 75%, 100%
- Les segments jusqu'au niveau actuel sont remplis, les autres vides
- **Clic sur un segment déjà actif** → repasse à l'étape précédente (ex : cliquer 50% quand progress=50 → met à 25%)
- **Clic sur un segment inactif** → applique ce niveau
- La barre est **masquée** pour les tâches dans l'accordéon "terminées"
- `progress` et `done` sont indépendants : une tâche à 100% n'est pas auto-cochée
- Style : barre fine sous le label, segments colorés avec la couleur accent (`--color-work` par défaut)

### Fichiers impactés

- `src/store/pomodoroStore.ts` — interface `Task`, action `setTaskProgress`, valeur par défaut `progress: 0` dans `addTask`
- `src/components/TaskList/TaskList.tsx` — `SortableTaskItem` : ajout de la barre
- `src/components/TaskList/TaskList.module.css` — styles de la barre

---

## 2. Persistance du minuteur

### Principe

Le mécanisme `endTimestamp` est déjà opérationnel : `useTimer.ts` calcule `timeLeft = ceil((endTimestamp - Date.now()) / 1000)` à chaque tick. Il suffit de persister la session dans localStorage et de gérer le rattrapage au rechargement.

### Changements store

Modifier `partialize` pour inclure la session :

```ts
partialize: (state) => ({
  // settings (existant)
  workDuration, shortBreakDuration, longBreakDuration,
  cyclesBeforeLongBreak, soundEnabled, notificationsEnabled, theme,
  tasks,
  // session — nouveau
  phase: state.phase,
  isRunning: state.isRunning,
  endTimestamp: state.endTimestamp,
  currentCycle: state.currentCycle,
  completedCycles: state.completedCycles,
})
```

### Rattrapage à l'hydratation

Dans `useTimer.ts`, au montage (effet sans dépendance de `isRunning`) :

```
Si isRunning === true && endTimestamp !== null :
  remaining = endTimestamp - Date.now()
  Si remaining <= 0 :
    → appeler advancePhase() (qui relance automatiquement avec un nouveau endTimestamp)
    (une seule avance : on ne simule pas plusieurs phases manquées)
  Sinon :
    → le timer reprend normalement au prochain tick
```

**Choix délibéré :** on n'avance que d'une phase maximum au rattrapage. Si l'utilisateur était absent plusieurs cycles, on arrive sur la phase suivante immédiate, sans simuler toutes les transitions intermédiaires.

### Cas `stop()` / `pause()`

- `stop()` remet `isRunning: false`, `endTimestamp: null`, `phase: 'idle'` → persisté, aucun rattrapage au rechargement
- `pause()` remet `isRunning: false`, `endTimestamp: null` → idem, timer pausé survit au rechargement

### Fichiers impactés

- `src/store/pomodoroStore.ts` — `partialize`
- `src/hooks/useTimer.ts` — logique de rattrapage au montage

---

## Tests

- `pomodoroStore.test.ts` : `setTaskProgress`, valeur par défaut `progress: 0`
- `useTimer.test.ts` : rattrapage au montage quand `endTimestamp` expiré
