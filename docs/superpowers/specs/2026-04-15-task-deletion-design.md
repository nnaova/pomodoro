# Design : Suppression de tâches

**Date :** 2026-04-15
**Statut :** Approuvé

## Contexte

La liste de tâches du Pomodoro ne permet actuellement pas de supprimer une tâche. L'utilisateur peut seulement les cocher. Il faut pouvoir supprimer n'importe quelle tâche (active ou terminée), et supprimer toutes les tâches terminées en une seule action.

## Comportement attendu

1. **Suppression individuelle** — chaque tâche (active et terminée) affiche un bouton ✕. Le clic supprime immédiatement la tâche, sans confirmation.
2. **Suppression groupée** — un bouton "Tout supprimer" dans le header de l'accordéon des tâches terminées. Un `window.confirm()` est affiché avant l'action. Si confirmé, toutes les tâches terminées sont supprimées.

## Changements

### `src/store/pomodoroStore.ts`

- Ajouter `deleteTask(id: string)` dans `Actions` : filtre `tasks` pour retirer la tâche avec l'id correspondant.
- Ajouter `deleteAllDoneTasks()` dans `Actions` : filtre `tasks` pour ne garder que les tâches avec `done: false`.

### `src/components/TaskList/TaskList.tsx`

- `SortableTaskItem` : ajouter un bouton ✕ à droite du label, appelle `deleteTask(task.id)`.
- `CompletedAccordion` :
  - Chaque tâche terminée dans le corps de l'accordéon reçoit un bouton ✕, appelle `deleteTask(task.id)`.
  - Le header de l'accordéon reçoit un bouton "Tout supprimer" (masqué si accordéon fermé n'est pas pertinent — toujours visible dans le header). Au clic : `window.confirm('Supprimer toutes les tâches terminées ?')`, puis `deleteAllDoneTasks()` si confirmé.

### `src/components/TaskList/TaskList.module.css`

- Nouveau style `.deleteBtn` : bouton sans fond ni bordure, couleur `--text-muted`, petit (12–13px), `flex-shrink: 0`. Hover : couleur rouge/destructive.

## Non-inclus

- Pas de "undo" après suppression.
- Pas de suppression groupée pour les tâches actives.
