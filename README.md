# Pomodoro Timer

Minuteur Pomodoro installable comme application (PWA), construit avec React 19, TypeScript et Vite.

## Fonctionnalités

- **Minuteur circulaire** avec progression visuelle animée en SVG
- **4 phases** : Prêt → Travail → Pause courte → Pause longue
- **Enchaînement automatique** des phases avec comptage des cycles
- **Son de fin de phase** via Web Audio API (aucune dépendance externe)
- **Notifications navigateur** en fin de phase (optionnelles)
- **Thème clair / sombre** persistant
- **Paramètres configurables** : durées des phases, nombre de cycles avant longue pause
- **Résistance au throttling** : le minuteur reste précis même quand l'onglet est en arrière-plan
- **PWA installable** : fonctionne hors-ligne, ajout à l'écran d'accueil

## Stack technique

| Rôle | Outil |
|---|---|
| UI | React 19 + CSS Modules |
| Typage | TypeScript 5.7 |
| Build | Vite 6 |
| État global | Zustand 5 |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest + Testing Library |

## Démarrage rapide

```bash
npm install
npm run dev
```

L'app est disponible sur `http://localhost:5173`.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec hot-reload |
| `npm run build` | Build de production (TypeScript + Vite) |
| `npm run preview` | Prévisualisation du build de production |
| `npm test` | Lance la suite de tests (mode watch) |
| `npm test -- --run` | Lance les tests une seule fois |

## Architecture

```
src/
├── App.tsx                          # Composant racine, orchestration du thème
├── main.tsx                         # Point d'entrée
│
├── store/
│   └── pomodoroStore.ts             # Store Zustand : état de session + paramètres
│
├── hooks/
│   └── useTimer.ts                  # Logique du minuteur (timestamp-based)
│
├── components/
│   ├── Timer/                       # Affichage circulaire SVG + temps restant
│   ├── Controls/                    # Boutons Démarrer / Pause / Stop / Passer
│   ├── CycleIndicator/              # Indicateurs visuels de cycles
│   ├── Header/                      # En-tête avec accès aux paramètres
│   └── Settings/                    # Panneau modal de configuration
│
└── utils/
    └── notifications.ts             # Sons (Web Audio API) + notifications (Web API)
```

## Gestion du minuteur

Le minuteur utilise une approche basée sur les **timestamps** plutôt que sur le comptage de ticks d'intervalle.

**Problème évité :** `setInterval` est [throttlé par les navigateurs](https://developer.chrome.com/blog/timer-throttling-in-chrome-88/) dans les onglets en arrière-plan (jusqu'à 1 tick/minute dans Chrome), ce qui ferait dériver le minuteur.

**Solution :** à chaque tick, `timeLeft` est calculé depuis l'heure réelle :

```ts
const remaining = Math.ceil((endTimestamp - Date.now()) / 1000)
```

Un listener `visibilitychange` corrige également le temps affiché **immédiatement** au retour sur l'onglet.

## État global (Zustand)

Le store `pomodoroStore` contient deux catégories de données :

**Paramètres** (persistés dans `localStorage`) :
- `workDuration`, `shortBreakDuration`, `longBreakDuration` (en minutes)
- `cyclesBeforeLongBreak`
- `soundEnabled`, `notificationsEnabled`
- `theme`

**Session** (non persistée) :
- `phase` : `idle | work | shortBreak | longBreak`
- `timeLeft` : secondes restantes
- `endTimestamp` : timestamp de fin de la phase courante (base de calcul du minuteur)
- `currentCycle`, `completedCycles`
- `isRunning`

## PWA et installation

Le manifeste (`manifest.webmanifest`) est généré par `vite-plugin-pwa` à partir de `vite.config.ts`. Il inclut :

- Champ `id` requis par Chrome 96+ pour l'identification stable de l'app
- `display_override` pour le support des modes d'affichage modernes
- Icônes 64px, 192px, 512px + icône maskable 512px
- Service worker Workbox en mode `generateSW` avec précache de tous les assets

Le Service Worker est enregistré en mode `autoUpdate` : les nouvelles versions sont appliquées silencieusement.

## Tests

La suite couvre :

- **`pomodoroStore.test.ts`** : toutes les actions du store (start, pause, stop, advancePhase, decrementTime, updateSettings) et la gestion de `endTimestamp`
- **`useTimer.test.ts`** : décompte, passage de phase, notifications, correction au retour sur l'onglet (`visibilitychange`)
- **`notifications.test.ts`** : envoi de notifications et sons selon la phase
- **`Timer.test.tsx`**, **`Controls.test.tsx`**, **`Settings.test.tsx`**, **`Header.test.tsx`** : comportement des composants

```bash
npm test -- --run
# 52 tests, 8 fichiers
```

## Valeurs par défaut

| Paramètre | Valeur |
|---|---|
| Durée de travail | 25 min |
| Pause courte | 5 min |
| Pause longue | 15 min |
| Cycles avant longue pause | 4 |
| Son | Activé |
| Notifications | Activé |
| Thème | Sombre |
