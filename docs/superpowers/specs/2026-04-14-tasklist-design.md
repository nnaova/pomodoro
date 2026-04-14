# Task List — Design Spec

**Date :** 2026-04-14
**Stack :** React + Vite + Zustand + @dnd-kit/sortable

---

## Contexte & objectif

Ajouter une liste de tâches sous le minuteur Pomodoro. Les tâches ont un titre, peuvent être cochées (terminées) et réordonnées manuellement. Les tâches terminées sont regroupées dans un accordéon collapsible. Tout est persisté en localStorage via le store Zustand existant.

---

## Modèle de données

Nouveau type ajouté dans `pomodoroStore.ts` :

```ts
export interface Task {
  id: string        // crypto.randomUUID()
  title: string
  done: boolean
  createdAt: number // timestamp ms
}
```

Le store Zustand gagne :
- `tasks: Task[]` — tableau ordonné (l'ordre du tableau = ordre d'affichage des tâches actives)
- `addTask(title: string)` — crée une tâche `done: false`, l'append en fin de tableau
- `toggleTask(id: string)` — bascule `done` sur la tâche correspondante
- `reorderTasks(activeId: string, overId: string)` — déplace la tâche `activeId` à la position de `overId` dans le tableau

`tasks` est inclus dans `partialize` pour être persisté en localStorage.

---

## Architecture des composants

Un seul nouveau composant `src/components/TaskList/TaskList.tsx` + `TaskList.module.css`.

Structure interne (tout dans le même fichier) :

```
TaskList
├── CompletedAccordion   — bandeau "X terminée(s)" cliquable, liste repliable
├── Liste active         — items drag-and-drop avec @dnd-kit/sortable
│   └── TaskItem         — poignée ⠿ + checkbox + titre
└── AddTaskInput         — lien "+ Ajouter une tâche" → input inline au clic
```

Dans `App.tsx`, `<TaskList />` est ajouté après `<Controls />` dans `<main>`.

---

## Comportement UI

### Ajout d'une tâche
- Cliquer "+ Ajouter une tâche" affiche un input inline à la place du lien
- `Entrée` ou `blur` : crée la tâche si le champ n'est pas vide, puis cache l'input
- La nouvelle tâche apparaît en bas de la liste active

### Cocher / décocher
- Cocher une tâche active : elle passe immédiatement dans la section terminées
- Décocher une tâche terminée : elle revient dans la liste active (en dernier)
- L'ordre des tâches actives est conservé lors des allers-retours

### Section terminées (accordéon)
- Le bandeau "X terminée(s)" n'est affiché que si au moins une tâche est `done`
- Clique pour déplier / replier la liste des tâches terminées
- Les tâches terminées sont listées dans l'ordre de création (non réordonnables)
- Chaque tâche terminée affiche sa checkbox (décochable)

### Réordonnancement (tâches actives seulement)
- Chaque tâche active affiche une poignée ⠿ à gauche
- Drag-and-drop via `@dnd-kit/sortable` avec support touch (PWA mobile)
- Le nouvel ordre est persisté immédiatement dans le store (`reorderTasks`)
- Les tâches terminées n'ont pas de poignée et ne sont pas réordonnables

---

## Dépendances à installer

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Intégration dans l'UI existante

- `TaskList` s'inscrit dans le layout `App.module.css` existant (max-width 480px, centré)
- Les CSS variables de thème existantes (`--surface`, `--text`, `--text-muted`, `--surface-elevated`, `--color-short-break`, etc.) sont utilisées — pas de nouvelles variables
- La section tâches est séparée visuellement du reste par une bordure supérieure (`border-top: 1px solid`)
- Compatible dark mode et light mode via les variables CSS existantes

---

## Ce qui n'est pas inclus (hors scope)

- Suppression de tâches
- Édition du titre d'une tâche existante
- Dates limites, priorités, labels
- Lien entre tâches et cycles Pomodoro
