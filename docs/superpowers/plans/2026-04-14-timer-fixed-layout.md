# Timer Fixed Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fixer la position du minuteur en haut de la page afin qu'il ne soit pas décalé par l'ajout de tâches.

**Architecture:** Diviser `main` en deux zones : `.timerZone` (hauteur fixe, contient Timer/CycleIndicator/Controls) et `.taskZone` (flexible, contient TaskList). Le `.main` passe de `justify-content: center` à `flex-start`.

**Tech Stack:** React, CSS Modules

---

### Task 1 : Modifier App.module.css

**Files:**
- Modify: `src/App.module.css`

- [ ] **Step 1 : Remplacer le contenu de `App.module.css`**

```css
/* src/App.module.css */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  padding: 0 16px;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 24px 0;
}

.timerZone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding-bottom: 24px;
  width: 100%;
}

.taskZone {
  width: 100%;
}
```

- [ ] **Step 2 : Vérifier visuellement que le fichier est correct**

```bash
cat src/App.module.css
```

---

### Task 2 : Modifier App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1 : Remplacer le contenu du `<main>` dans App.tsx**

Remplacer :
```tsx
<main className={styles.main}>
  <Timer />
  <CycleIndicator />
  <Controls />
  <TaskList />
</main>
```

Par :
```tsx
<main className={styles.main}>
  <div className={styles.timerZone}>
    <Timer />
    <CycleIndicator />
    <Controls />
  </div>
  <div className={styles.taskZone}>
    <TaskList />
  </div>
</main>
```

- [ ] **Step 2 : Lancer les tests pour vérifier qu'aucune régression**

```bash
npx vitest run
```

Résultat attendu : tous les tests passent (aucun test ne teste la structure DOM de App directement).

- [ ] **Step 3 : Commit**

```bash
git add src/App.tsx src/App.module.css
git commit -m "fix: split main into timerZone and taskZone to prevent timer shift"
```
