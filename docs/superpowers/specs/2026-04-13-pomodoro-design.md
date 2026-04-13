# Pomodoro PWA — Design Spec

**Date :** 2026-04-13  
**Stack :** React + Vite + Zustand + vite-plugin-pwa

---

## Contexte & objectif

Application web minuteur Pomodoro installable sur téléphone (PWA). Les cycles suivent la méthode Pomodoro classique (travail → pause courte, longue pause après N cycles) et tournent en boucle jusqu'à arrêt manuel. Notifications navigateur et sons alertent à chaque fin de cycle, chacun activable indépendamment. Les paramètres sont persistés entre sessions.

---

## Architecture générale

```
pomodoro/
├── public/
│   └── icons/                  # Icônes PWA (192x192, 512x512)
├── src/
│   ├── components/
│   │   ├── Timer.tsx            # Cercle SVG animé + chiffres MM:SS
│   │   ├── Controls.tsx         # Boutons start/pause/stop/skip
│   │   ├── CycleIndicator.tsx   # Dots de cycles complétés
│   │   ├── Settings.tsx         # Panneau de configuration
│   │   └── NotificationToggle.tsx  # Toggles son / notif
│   ├── store/
│   │   └── pomodoroStore.ts     # Zustand store + persist
│   ├── hooks/
│   │   └── useTimer.ts          # setInterval, transitions de phase
│   ├── utils/
│   │   └── notifications.ts     # Web Audio API + Browser Notifications
│   ├── App.tsx
│   └── main.tsx
└── vite.config.ts               # vite-plugin-pwa configuré
```

**Flux de données :** `useTimer` lit le store → décrémente chaque seconde → à 0, déclenche notifications et transition de phase → met à jour le store → re-render des composants.

---

## State management — Zustand store

### Settings (persistées en localStorage)
```ts
{
  workDuration: 25,              // minutes
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark' | 'light',
}
```

### Session (non persistée — réinitialisée à la fermeture)
```ts
{
  phase: 'idle' | 'work' | 'shortBreak' | 'longBreak',
  timeLeft: number,              // secondes restantes
  currentCycle: number,          // 0-based, réinitialisé à 0 après longue pause
  completedCycles: number,       // total de cycles de travail depuis démarrage
  isRunning: boolean,
}
```

### Actions exposées
`start()`, `pause()`, `stop()`, `skip()`, `tick()`, `nextPhase()`, `updateSettings()`

---

## Logique timer & transitions

`useTimer.ts` monte un `setInterval` de 1 seconde quand `isRunning === true`.

**`tick()`** :
- `timeLeft > 0` → décrémente
- `timeLeft === 0` → appelle `onPhaseEnd()`

**`onPhaseEnd()`** :
```
Si phase === 'work' :
  completedCycles++, currentCycle++
  currentCycle >= cyclesBeforeLongBreak → longBreak, currentCycle = 0
  sinon → shortBreak

Si phase === 'shortBreak' | 'longBreak' :
  → work

Dans tous les cas :
  → déclencher son (si soundEnabled)
  → envoyer notification (si notificationsEnabled)
  → démarrer automatiquement la phase suivante
```

**Contrôles :**
- **Start/Pause** — lance ou met en pause
- **Stop** — réinitialise tout (retour idle)
- **Skip** — passe à la phase suivante sans notifications

---

## PWA

- `vite-plugin-pwa` en mode `generateSW`
- Manifest : `display: standalone`, thème color, icônes 192 + 512px
- Service Worker : mise en cache complète pour usage hors-ligne
- Bouton d'installation via événement `beforeinstallprompt` (bannière custom)

---

## Notifications & Son

**Notifications navigateur :**
- `Notification.requestPermission()` au premier toggle
- `new Notification(titre, { body, icon })` à chaque fin de phase
- Compatible iOS en mode PWA installée

**Son (Web Audio API — aucun fichier audio) :**
- Fin de travail : oscillateur grave descendant (~440Hz)
- Fin de pause : oscillateur aigu montant (~660Hz)
- Toggle indépendant, ne perturbe pas le timer

---

## UI / Design

**Thème :** Dark mode par défaut, toggle light en haut à droite.

**Écran principal :**
- Grand cercle SVG (progress ring) centré, couleur par phase :
  - Travail → rouge/orange
  - Pause courte → vert
  - Pause longue → bleu
- `MM:SS` en grand au centre
- Label de phase sous le timer
- Dots de cycles (● ● ○ ○)
- Boutons : Start/Pause · Stop · Skip
- Icône ⚙ (haut gauche) → panneau Settings
- Icônes son + notif (haut droite) + toggle dark/light

**Panneau Settings :**
- Inputs numériques pour les 4 durées (travail, pause courte, pause longue, cycles)
- Bouton "Valeurs par défaut"

**Responsive :** centré, fonctionne de 375px à desktop.

**Animations :** progress ring SVG temps réel, transition de couleur fluide au changement de phase.

---

## Vérification (end-to-end)

1. `npm run dev` → app accessible sur localhost
2. Démarrer un cycle, vérifier la décrémentation
3. Passer en mode "1 minute" pour tester la transition automatique work → break → work
4. Vérifier les notifications navigateur (permission + popup)
5. Vérifier les sons (deux tons distincts)
6. Modifier les settings → vérifier persistence après rechargement
7. `npm run build` → `npx serve dist` → tester en mode production
8. DevTools > Application > Manifest → vérifier PWA valide
9. DevTools > Lighthouse → score PWA ≥ 90
10. Tester l'installation sur Android (Chrome) et iOS (Safari "Ajouter à l'écran d'accueil")
