# Timer Fixed Layout Design

**Date:** 2026-04-14  
**Status:** Approved

## Problème

Le minuteur se décale vers le haut quand des tâches sont ajoutées, car `main` utilise `justify-content: center` et recalcule son centre vertical à chaque ajout.

## Solution : Deux zones séparées (Option B)

Diviser `main` en deux zones distinctes dans `App.tsx` et `App.module.css`.

### Layout

- **`.timerZone`** — hauteur fixe (~320px), flex column, centré verticalement et horizontalement. Contient `<Timer>`, `<CycleIndicator>`, `<Controls>`. Immuable peu importe le nombre de tâches.
- **`.taskZone`** — width 100%, hauteur flexible. Contient `<TaskList>`. Grandit vers le bas sans jamais affecter la zone timer.

### Fichiers modifiés

- `src/App.tsx` — regrouper les composants dans les deux div
- `src/App.module.css` — ajouter `.timerZone` et `.taskZone`, ajuster `.main`
