# Pomodoro PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Pomodoro timer PWA installable sur mobile, avec cycles configurables, boucle automatique, et alertes son/notification indépendantes.

**Architecture:** Zustand store en deux parties (settings persistées localStorage, session éphémère) + hook `useTimer` qui pilote le `setInterval` et déclenche les notifications en fin de phase. Les composants React lisent le store et se re-rendent à chaque changement.

**Tech Stack:** React 18, TypeScript, Vite 5, Zustand 4, vite-plugin-pwa, @vite-pwa/assets-generator, Vitest, @testing-library/react, CSS Modules

---

## File Map

| Fichier | Responsabilité |
|---------|----------------|
| `src/store/pomodoroStore.ts` | Zustand store : settings (persistées) + session (éphémère) + actions |
| `src/hooks/useTimer.ts` | setInterval 1s, décrémente, déclenche notifications + `advancePhase` en fin de phase |
| `src/utils/notifications.ts` | Web Audio API (sons générés) + Browser Notifications API |
| `src/components/Timer/Timer.tsx` | SVG progress ring + affichage MM:SS en overlay |
| `src/components/Controls/Controls.tsx` | Boutons Start/Pause, Stop, Skip |
| `src/components/CycleIndicator/CycleIndicator.tsx` | Dots de cycles complétés |
| `src/components/Header/Header.tsx` | Bouton settings, toggles son/notif/thème |
| `src/components/Settings/Settings.tsx` | Modal avec inputs de durées |
| `src/App.tsx` | Layout racine, applique le thème sur `<html>`, monte `useTimer` |
| `src/index.css` | CSS custom properties dark/light, reset, base |
| `vite.config.ts` | Config Vite + plugin PWA + config Vitest |
| `public/logo.svg` | Source SVG pour génération des icônes PWA |

---

## Task 1 : Scaffold du projet

**Files:**
- Create: `vite.config.ts`
- Create: `src/test/setup.ts`
- Create: `tsconfig.json` (modifié)

- [ ] **Step 1 : Initialiser le projet Vite + React + TypeScript**

```bash
cd /home/alexandre/Documents/devlopement/pomodoro
npm create vite@latest . -- --template react-ts
```

Répondre `y` si on demande de créer dans un dossier non vide.

- [ ] **Step 2 : Installer les dépendances**

```bash
npm install zustand
npm install -D vite-plugin-pwa @vite-pwa/assets-generator
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 3 : Configurer `vite.config.ts`**

Remplacer le contenu généré par :

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Pomodoro Timer',
        short_name: 'Pomodoro',
        description: 'Minuteur Pomodoro configurable',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 4 : Créer le fichier de setup des tests**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5 : Nettoyer les fichiers générés inutiles**

```bash
rm src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 6 : Vérifier que les tests s'exécutent**

```bash
npx vitest run
```

Attendu : "No test files found" (pas d'erreur de config).

- [ ] **Step 7 : Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Vite + React + TS + Zustand + vite-plugin-pwa + Vitest"
```

---

## Task 2 : Zustand Store (TDD)

**Files:**
- Create: `src/store/pomodoroStore.ts`
- Create: `src/store/pomodoroStore.test.ts`

- [ ] **Step 1 : Écrire les tests (fichier vide d'abord)**

```typescript
// src/store/pomodoroStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePomodoroStore } from './pomodoroStore'

const DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark' as const,
  phase: 'idle' as const,
  timeLeft: 25 * 60,
  currentCycle: 0,
  completedCycles: 0,
  isRunning: false,
}

beforeEach(() => {
  usePomodoroStore.setState(DEFAULTS)
})

describe('start', () => {
  it('passe de idle à work et démarre le timer', () => {
    usePomodoroStore.getState().start()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('work')
    expect(s.isRunning).toBe(true)
    expect(s.timeLeft).toBe(25 * 60)
  })

  it('reprend un timer en pause sans réinitialiser timeLeft', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 600, isRunning: false })
    usePomodoroStore.getState().start()
    expect(usePomodoroStore.getState().isRunning).toBe(true)
    expect(usePomodoroStore.getState().timeLeft).toBe(600)
  })
})

describe('pause', () => {
  it('met isRunning à false', () => {
    usePomodoroStore.setState({ isRunning: true })
    usePomodoroStore.getState().pause()
    expect(usePomodoroStore.getState().isRunning).toBe(false)
  })
})

describe('stop', () => {
  it('réinitialise toute la session à idle', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, currentCycle: 2, completedCycles: 5, isRunning: true })
    usePomodoroStore.getState().stop()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('idle')
    expect(s.timeLeft).toBe(25 * 60)
    expect(s.currentCycle).toBe(0)
    expect(s.completedCycles).toBe(0)
    expect(s.isRunning).toBe(false)
  })
})

describe('decrementTime', () => {
  it('réduit timeLeft de 1', () => {
    usePomodoroStore.setState({ timeLeft: 100 })
    usePomodoroStore.getState().decrementTime()
    expect(usePomodoroStore.getState().timeLeft).toBe(99)
  })
})

describe('advancePhase', () => {
  it('work → shortBreak quand currentCycle < cyclesBeforeLongBreak', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 0, completedCycles: 0 })
    usePomodoroStore.getState().advancePhase()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('shortBreak')
    expect(s.completedCycles).toBe(1)
    expect(s.currentCycle).toBe(1)
    expect(s.isRunning).toBe(true)
  })

  it('work → longBreak quand currentCycle atteint cyclesBeforeLongBreak', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 3, completedCycles: 3, cyclesBeforeLongBreak: 4 })
    usePomodoroStore.getState().advancePhase()
    const s = usePomodoroStore.getState()
    expect(s.phase).toBe('longBreak')
    expect(s.currentCycle).toBe(0)
    expect(s.completedCycles).toBe(4)
  })

  it('shortBreak → work', () => {
    usePomodoroStore.setState({ phase: 'shortBreak' })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('longBreak → work', () => {
    usePomodoroStore.setState({ phase: 'longBreak' })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('remet timeLeft à la durée de la nouvelle phase', () => {
    usePomodoroStore.setState({ phase: 'work', currentCycle: 0, shortBreakDuration: 5 })
    usePomodoroStore.getState().advancePhase()
    expect(usePomodoroStore.getState().timeLeft).toBe(5 * 60)
  })
})

describe('updateSettings', () => {
  it('met à jour les durées', () => {
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().workDuration).toBe(30)
  })

  it('met à jour timeLeft si phase est idle', () => {
    usePomodoroStore.setState({ phase: 'idle' })
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().timeLeft).toBe(30 * 60)
  })

  it('ne touche pas timeLeft si timer en cours', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 600 })
    usePomodoroStore.getState().updateSettings({ workDuration: 30 })
    expect(usePomodoroStore.getState().timeLeft).toBe(600)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/store/pomodoroStore.test.ts
```

Attendu : FAIL — "Cannot find module './pomodoroStore'"

- [ ] **Step 3 : Implémenter le store**

```typescript
// src/store/pomodoroStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Phase = 'idle' | 'work' | 'shortBreak' | 'longBreak'
export type Theme = 'dark' | 'light'

export interface Settings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  cyclesBeforeLongBreak: number
  soundEnabled: boolean
  notificationsEnabled: boolean
  theme: Theme
}

export interface Session {
  phase: Phase
  timeLeft: number        // secondes
  currentCycle: number    // 0-based, reset à 0 après longue pause
  completedCycles: number // total depuis démarrage
  isRunning: boolean
}

interface Actions {
  start: () => void
  pause: () => void
  stop: () => void
  decrementTime: () => void
  advancePhase: () => void
  updateSettings: (s: Partial<Settings>) => void
}

export type PomodoroStore = Settings & Session & Actions

const DEFAULT_SETTINGS: Settings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
  notificationsEnabled: true,
  theme: 'dark',
}

export const usePomodoroStore = create<PomodoroStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      phase: 'idle' as Phase,
      timeLeft: DEFAULT_SETTINGS.workDuration * 60,
      currentCycle: 0,
      completedCycles: 0,
      isRunning: false,

      start: () => {
        const { phase, workDuration } = get()
        if (phase === 'idle') {
          set({ phase: 'work', timeLeft: workDuration * 60, isRunning: true })
        } else {
          set({ isRunning: true })
        }
      },

      pause: () => set({ isRunning: false }),

      stop: () => {
        const { workDuration } = get()
        set({
          phase: 'idle',
          timeLeft: workDuration * 60,
          currentCycle: 0,
          completedCycles: 0,
          isRunning: false,
        })
      },

      decrementTime: () => set((s) => ({ timeLeft: s.timeLeft - 1 })),

      advancePhase: () => {
        const {
          phase, currentCycle, completedCycles, cyclesBeforeLongBreak,
          workDuration, shortBreakDuration, longBreakDuration,
        } = get()

        let newPhase: Phase
        let newCurrentCycle = currentCycle
        let newCompletedCycles = completedCycles

        if (phase === 'work') {
          newCompletedCycles++
          newCurrentCycle++
          if (newCurrentCycle >= cyclesBeforeLongBreak) {
            newPhase = 'longBreak'
            newCurrentCycle = 0
          } else {
            newPhase = 'shortBreak'
          }
        } else {
          newPhase = 'work'
        }

        const durations: Record<Phase, number> = {
          idle: workDuration,
          work: workDuration,
          shortBreak: shortBreakDuration,
          longBreak: longBreakDuration,
        }

        set({
          phase: newPhase,
          timeLeft: durations[newPhase] * 60,
          currentCycle: newCurrentCycle,
          completedCycles: newCompletedCycles,
          isRunning: true,
        })
      },

      updateSettings: (newSettings) => {
        set(newSettings)
        const state = get()
        if (state.phase === 'idle') {
          set({ timeLeft: state.workDuration * 60 })
        }
      },
    }),
    {
      name: 'pomodoro-settings',
      partialize: (state) => ({
        workDuration: state.workDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        cyclesBeforeLongBreak: state.cyclesBeforeLongBreak,
        soundEnabled: state.soundEnabled,
        notificationsEnabled: state.notificationsEnabled,
        theme: state.theme,
      }),
    }
  )
)
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/store/pomodoroStore.test.ts
```

Attendu : tous les tests PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/store/
git commit -m "feat: add Zustand store with settings persistence and phase logic"
```

---

## Task 3 : Notifications Utility (TDD)

**Files:**
- Create: `src/utils/notifications.ts`
- Create: `src/utils/notifications.test.ts`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/utils/notifications.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AudioContext
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { setValueAtTime: vi.fn() },
  type: 'sine' as OscillatorType,
}
const mockGainNode = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
}
const mockAudioContext = {
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGainNode),
  destination: {},
  currentTime: 0,
}
vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext))

// Mock Notification API
const mockNotification = vi.fn()
mockNotification.permission = 'granted'
mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
vi.stubGlobal('Notification', mockNotification)

import {
  playPhaseEndSound,
  requestNotificationPermission,
  sendPhaseNotification,
} from './notifications'

beforeEach(() => {
  vi.clearAllMocks()
  mockNotification.permission = 'granted'
})

describe('playPhaseEndSound', () => {
  it('crée un oscillateur pour la phase work', () => {
    playPhaseEndSound('work')
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
    expect(mockOscillator.start).toHaveBeenCalled()
  })

  it('crée un oscillateur pour la phase shortBreak', () => {
    playPhaseEndSound('shortBreak')
    expect(mockAudioContext.createOscillator).toHaveBeenCalled()
  })
})

describe('requestNotificationPermission', () => {
  it('retourne true si permission accordée', async () => {
    mockNotification.permission = 'default'
    mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('retourne true si permission déjà granted', async () => {
    mockNotification.permission = 'granted'
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
    expect(mockNotification.requestPermission).not.toHaveBeenCalled()
  })

  it('retourne false si permission refusée', async () => {
    mockNotification.permission = 'default'
    mockNotification.requestPermission = vi.fn().mockResolvedValue('denied')
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

describe('sendPhaseNotification', () => {
  it('envoie une notification pour la phase work', () => {
    sendPhaseNotification('work')
    expect(mockNotification).toHaveBeenCalledWith(
      'Pause !',
      expect.objectContaining({ body: expect.any(String) })
    )
  })

  it('envoie une notification pour shortBreak', () => {
    sendPhaseNotification('shortBreak')
    expect(mockNotification).toHaveBeenCalledWith(
      'Au travail !',
      expect.objectContaining({ body: expect.any(String) })
    )
  })

  it("n'envoie pas de notification si permission non accordée", () => {
    mockNotification.permission = 'denied'
    sendPhaseNotification('work')
    expect(mockNotification).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/utils/notifications.test.ts
```

Attendu : FAIL — "Cannot find module './notifications'"

- [ ] **Step 3 : Implémenter `notifications.ts`**

```typescript
// src/utils/notifications.ts
import { Phase } from '../store/pomodoroStore'

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function playTone(frequency: number, duration: number): void {
  const ctx = getAudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

// Fin de travail : ton grave descendant
function playWorkEndSound(): void {
  playTone(440, 0.4)
  setTimeout(() => playTone(330, 0.6), 400)
}

// Fin de pause : ton aigu montant
function playBreakEndSound(): void {
  playTone(330, 0.4)
  setTimeout(() => playTone(440, 0.6), 400)
}

export function playPhaseEndSound(phase: Phase): void {
  if (phase === 'work') playWorkEndSound()
  else playBreakEndSound()
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

const PHASE_MESSAGES: Partial<Record<Phase, { title: string; body: string }>> = {
  work: { title: 'Pause !', body: 'Cycle de travail terminé. Temps de souffler.' },
  shortBreak: { title: 'Au travail !', body: "Pause terminée. C'est reparti !" },
  longBreak: { title: 'Au travail !', body: "Longue pause terminée. C'est reparti !" },
}

export function sendPhaseNotification(phase: Phase): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const msg = PHASE_MESSAGES[phase]
  if (!msg) return
  new Notification(msg.title, { body: msg.body, icon: '/icons/pwa-192x192.png' })
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/utils/notifications.test.ts
```

Attendu : tous les tests PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/utils/
git commit -m "feat: add Web Audio API sounds and Browser Notifications utility"
```

---

## Task 4 : Hook useTimer (TDD)

**Files:**
- Create: `src/hooks/useTimer.ts`
- Create: `src/hooks/useTimer.test.ts`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/hooks/useTimer.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { playPhaseEndSound, sendPhaseNotification } from '../utils/notifications'
import { useTimer } from './useTimer'

vi.mock('../utils/notifications', () => ({
  playPhaseEndSound: vi.fn(),
  sendPhaseNotification: vi.fn(),
}))

const DEFAULTS = {
  workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
  cyclesBeforeLongBreak: 4, soundEnabled: true, notificationsEnabled: true,
  theme: 'dark' as const, phase: 'idle' as const,
  timeLeft: 25 * 60, currentCycle: 0, completedCycles: 0, isRunning: false,
}

beforeEach(() => {
  vi.useFakeTimers()
  usePomodoroStore.setState(DEFAULTS)
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTimer', () => {
  it("ne décrémente pas si isRunning est false", () => {
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60)
  })

  it('décrémente timeLeft chaque seconde quand isRunning est true', () => {
    usePomodoroStore.setState({ phase: 'work', isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(3000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(25 * 60 - 3)
  })

  it('appelle playPhaseEndSound et advancePhase quand timeLeft atteint 0', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 1, isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(playPhaseEndSound).toHaveBeenCalledWith('work')
    expect(usePomodoroStore.getState().phase).toBe('shortBreak')
  })

  it('appelle sendPhaseNotification si notificationsEnabled', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 1, isRunning: true, notificationsEnabled: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(sendPhaseNotification).toHaveBeenCalledWith('work')
  })

  it("n'appelle pas les notifications si désactivées", () => {
    usePomodoroStore.setState({
      phase: 'work', timeLeft: 1, isRunning: true,
      soundEnabled: false, notificationsEnabled: false,
    })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(1000) })
    expect(playPhaseEndSound).not.toHaveBeenCalled()
    expect(sendPhaseNotification).not.toHaveBeenCalled()
  })

  it('arrête de décrémenter si isRunning passe à false', () => {
    usePomodoroStore.setState({ phase: 'work', timeLeft: 100, isRunning: true })
    renderHook(() => useTimer())
    act(() => { vi.advanceTimersByTime(2000) })
    act(() => { usePomodoroStore.getState().pause() })
    act(() => { vi.advanceTimersByTime(5000) })
    expect(usePomodoroStore.getState().timeLeft).toBe(98)
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/hooks/useTimer.test.ts
```

Attendu : FAIL — "Cannot find module './useTimer'"

- [ ] **Step 3 : Implémenter `useTimer.ts`**

```typescript
// src/hooks/useTimer.ts
import { useEffect } from 'react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { playPhaseEndSound, sendPhaseNotification } from '../utils/notifications'

export function useTimer(): void {
  const isRunning = usePomodoroStore((s) => s.isRunning)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const state = usePomodoroStore.getState()
      if (!state.isRunning) return

      if (state.timeLeft <= 1) {
        const { phase, soundEnabled, notificationsEnabled } = state
        if (soundEnabled) playPhaseEndSound(phase)
        if (notificationsEnabled) sendPhaseNotification(phase)
        state.advancePhase()
      } else {
        state.decrementTime()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/hooks/useTimer.test.ts
```

Attendu : tous les tests PASS.

- [ ] **Step 5 : Lancer tous les tests pour vérifier qu'il n'y a pas de régression**

```bash
npx vitest run
```

Attendu : tous les tests PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/hooks/
git commit -m "feat: add useTimer hook with interval management and phase transitions"
```

---

## Task 5 : Système de thème CSS

**Files:**
- Create: `src/index.css`
- Create: `src/App.module.css`

- [ ] **Step 1 : Créer `src/index.css`**

```css
/* src/index.css */
:root[data-theme='dark'] {
  --bg: #1a1a2e;
  --surface: #16213e;
  --surface-elevated: #0f3460;
  --text: #e2e8f0;
  --text-muted: #8892b0;
  --color-work: #e94560;
  --color-short-break: #4ecca3;
  --color-long-break: #5b8dee;
  --color-track: #2d3561;
  --btn-bg: #0f3460;
  --btn-hover: #1a4a80;
  --btn-text: #e2e8f0;
  --overlay: rgba(0, 0, 0, 0.75);
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
}

:root[data-theme='light'] {
  --bg: #f0f4f8;
  --surface: #ffffff;
  --surface-elevated: #e8edf2;
  --text: #1a202c;
  --text-muted: #718096;
  --color-work: #c0392b;
  --color-short-break: #27ae60;
  --color-long-break: #2980b9;
  --color-track: #cbd5e0;
  --btn-bg: #e2e8f0;
  --btn-hover: #cbd5e0;
  --btn-text: #1a202c;
  --overlay: rgba(0, 0, 0, 0.4);
  --shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  transition: background 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

input[type='number'] {
  font-family: inherit;
}
```

- [ ] **Step 2 : Créer `src/App.module.css`**

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
  justify-content: center;
  flex: 1;
  gap: 24px;
  padding: 24px 0;
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/index.css src/App.module.css
git commit -m "feat: add CSS theme system with dark/light custom properties"
```

---

## Task 6 : Composant Timer (SVG Progress Ring)

**Files:**
- Create: `src/components/Timer/Timer.tsx`
- Create: `src/components/Timer/Timer.module.css`
- Create: `src/components/Timer/Timer.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/Timer/Timer.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Timer } from './Timer'

beforeEach(() => {
  usePomodoroStore.setState({
    phase: 'idle', timeLeft: 25 * 60,
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    currentCycle: 0, completedCycles: 0, isRunning: false,
  })
})

describe('Timer', () => {
  it('affiche le temps formaté MM:SS', () => {
    usePomodoroStore.setState({ timeLeft: 25 * 60 })
    render(<Timer />)
    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('affiche 09:05 pour 545 secondes', () => {
    usePomodoroStore.setState({ timeLeft: 545 })
    render(<Timer />)
    expect(screen.getByText('09:05')).toBeInTheDocument()
  })

  it('affiche le label de phase work', () => {
    usePomodoroStore.setState({ phase: 'work' })
    render(<Timer />)
    expect(screen.getByText('Travail')).toBeInTheDocument()
  })

  it('affiche le label Pause courte', () => {
    usePomodoroStore.setState({ phase: 'shortBreak' })
    render(<Timer />)
    expect(screen.getByText('Pause courte')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/components/Timer/Timer.test.tsx
```

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/Timer/Timer.tsx
import styles from './Timer.module.css'
import { usePomodoroStore, Phase } from '../../store/pomodoroStore'

const RADIUS = 110
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const PHASE_COLORS: Record<Phase, string> = {
  idle: 'var(--color-work)',
  work: 'var(--color-work)',
  shortBreak: 'var(--color-short-break)',
  longBreak: 'var(--color-long-break)',
}

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Prêt',
  work: 'Travail',
  shortBreak: 'Pause courte',
  longBreak: 'Pause longue',
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function Timer() {
  const { phase, timeLeft, workDuration, shortBreakDuration, longBreakDuration } = usePomodoroStore()

  const durations: Record<Phase, number> = {
    idle: workDuration * 60,
    work: workDuration * 60,
    shortBreak: shortBreakDuration * 60,
    longBreak: longBreakDuration * 60,
  }

  const total = durations[phase]
  const progress = total > 0 ? (total - timeLeft) / total : 0
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)
  const color = PHASE_COLORS[phase]

  return (
    <div className={styles.container}>
      <svg
        width="260"
        height="260"
        viewBox="0 0 260 260"
        aria-label={`Timer: ${formatTime(timeLeft)}`}
      >
        <circle
          cx="130" cy="130" r={RADIUS}
          fill="none"
          stroke="var(--color-track)"
          strokeWidth="10"
        />
        <circle
          cx="130" cy="130" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 130 130)"
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.5s ease' }}
        />
      </svg>
      <div className={styles.textOverlay}>
        <span className={styles.time}>{formatTime(timeLeft)}</span>
        <span className={styles.label}>{PHASE_LABELS[phase]}</span>
      </div>
    </div>
  )
}
```

```css
/* src/components/Timer/Timer.module.css */
.container {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.textOverlay {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  pointer-events: none;
}

.time {
  font-size: 3.5rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  color: var(--text);
}

.label {
  font-size: 0.875rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/components/Timer/Timer.test.tsx
```

Attendu : tous les tests PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/components/Timer/
git commit -m "feat: add SVG progress ring Timer component"
```

---

## Task 7 : Composant Controls

**Files:**
- Create: `src/components/Controls/Controls.tsx`
- Create: `src/components/Controls/Controls.module.css`
- Create: `src/components/Controls/Controls.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/Controls/Controls.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Controls } from './Controls'

beforeEach(() => {
  usePomodoroStore.setState({
    phase: 'idle', isRunning: false, timeLeft: 25 * 60,
    currentCycle: 0, completedCycles: 0,
    workDuration: 25, shortBreakDuration: 5, longBreakDuration: 15,
    cyclesBeforeLongBreak: 4,
  })
})

describe('Controls', () => {
  it('affiche le bouton Start quand isRunning est false', () => {
    render(<Controls />)
    expect(screen.getByLabelText('Démarrer')).toBeInTheDocument()
  })

  it('affiche le bouton Pause quand isRunning est true', () => {
    usePomodoroStore.setState({ isRunning: true, phase: 'work' })
    render(<Controls />)
    expect(screen.getByLabelText('Pause')).toBeInTheDocument()
  })

  it('appelle start() au clic sur Démarrer', async () => {
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Démarrer'))
    expect(usePomodoroStore.getState().isRunning).toBe(true)
    expect(usePomodoroStore.getState().phase).toBe('work')
  })

  it('appelle pause() au clic sur Pause', async () => {
    usePomodoroStore.setState({ isRunning: true, phase: 'work' })
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Pause'))
    expect(usePomodoroStore.getState().isRunning).toBe(false)
  })

  it('désactive Stop et Skip quand phase est idle', () => {
    render(<Controls />)
    expect(screen.getByLabelText('Arrêter')).toBeDisabled()
    expect(screen.getByLabelText('Passer')).toBeDisabled()
  })

  it('appelle stop() au clic sur Arrêter', async () => {
    usePomodoroStore.setState({ phase: 'work', isRunning: true })
    render(<Controls />)
    await userEvent.click(screen.getByLabelText('Arrêter'))
    expect(usePomodoroStore.getState().phase).toBe('idle')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/components/Controls/Controls.test.tsx
```

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/Controls/Controls.tsx
import styles from './Controls.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

export function Controls() {
  const { isRunning, phase, start, pause, stop, advancePhase } = usePomodoroStore()
  const isIdle = phase === 'idle'

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.btn} ${styles.secondary}`}
        onClick={stop}
        disabled={isIdle}
        aria-label="Arrêter"
      >
        ■
      </button>
      <button
        className={`${styles.btn} ${styles.primary}`}
        onClick={isRunning ? pause : start}
        aria-label={isRunning ? 'Pause' : 'Démarrer'}
      >
        {isRunning ? '⏸' : '▶'}
      </button>
      <button
        className={`${styles.btn} ${styles.secondary}`}
        onClick={() => advancePhase()}
        disabled={isIdle}
        aria-label="Passer"
      >
        ⏭
      </button>
    </div>
  )
}
```

```css
/* src/components/Controls/Controls.module.css */
.controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease, transform 0.1s ease;
  color: var(--btn-text);
  background: var(--btn-bg);
}

.btn:hover:not(:disabled) {
  background: var(--btn-hover);
  transform: scale(1.05);
}

.btn:active:not(:disabled) {
  transform: scale(0.96);
}

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.primary {
  width: 72px;
  height: 72px;
  font-size: 1.5rem;
  background: var(--color-work);
  color: #fff;
}

.primary:hover:not(:disabled) {
  background: var(--color-work);
  filter: brightness(1.15);
}

.secondary {
  width: 52px;
  height: 52px;
  font-size: 1.1rem;
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/components/Controls/Controls.test.tsx
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/Controls/
git commit -m "feat: add Controls component with start/pause/stop/skip"
```

---

## Task 8 : Composant CycleIndicator

**Files:**
- Create: `src/components/CycleIndicator/CycleIndicator.tsx`
- Create: `src/components/CycleIndicator/CycleIndicator.module.css`
- Create: `src/components/CycleIndicator/CycleIndicator.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/CycleIndicator/CycleIndicator.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { CycleIndicator } from './CycleIndicator'

beforeEach(() => {
  usePomodoroStore.setState({ currentCycle: 0, cyclesBeforeLongBreak: 4 })
})

describe('CycleIndicator', () => {
  it('affiche N dots égal à cyclesBeforeLongBreak', () => {
    render(<CycleIndicator />)
    // 4 dots aria-hidden, on vérifie via le container
    const container = screen.getByRole('group')
    expect(container.children).toHaveLength(4)
  })

  it('marque 2 dots comme complétés quand currentCycle est 2', () => {
    usePomodoroStore.setState({ currentCycle: 2 })
    render(<CycleIndicator />)
    const dots = screen.getByRole('group').children
    expect(dots[0]).toHaveClass('filled')
    expect(dots[1]).toHaveClass('filled')
    expect(dots[2]).not.toHaveClass('filled')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/components/CycleIndicator/CycleIndicator.test.tsx
```

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/CycleIndicator/CycleIndicator.tsx
import styles from './CycleIndicator.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

export function CycleIndicator() {
  const { currentCycle, cyclesBeforeLongBreak } = usePomodoroStore()

  return (
    <div
      className={styles.dots}
      role="group"
      aria-label={`Cycle ${currentCycle} sur ${cyclesBeforeLongBreak}`}
    >
      {Array.from({ length: cyclesBeforeLongBreak }).map((_, i) => (
        <span
          key={i}
          className={`${styles.dot} ${i < currentCycle ? styles.filled : ''}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}
```

```css
/* src/components/CycleIndicator/CycleIndicator.module.css */
.dots {
  display: flex;
  gap: 10px;
  align-items: center;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-track);
  transition: background 0.3s ease, transform 0.3s ease;
}

.filled {
  background: var(--color-work);
  transform: scale(1.2);
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/components/CycleIndicator/CycleIndicator.test.tsx
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/CycleIndicator/
git commit -m "feat: add CycleIndicator dots component"
```

---

## Task 9 : Composant Header

**Files:**
- Create: `src/components/Header/Header.tsx`
- Create: `src/components/Header/Header.module.css`
- Create: `src/components/Header/Header.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/Header/Header.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Header } from './Header'

vi.mock('../../utils/notifications', () => ({
  requestNotificationPermission: vi.fn().mockResolvedValue(true),
}))

beforeEach(() => {
  usePomodoroStore.setState({
    soundEnabled: true, notificationsEnabled: true, theme: 'dark',
  })
})

describe('Header', () => {
  it('appelle onSettingsClick au clic sur le bouton paramètres', async () => {
    const onSettingsClick = vi.fn()
    render(<Header onSettingsClick={onSettingsClick} />)
    await userEvent.click(screen.getByLabelText('Paramètres'))
    expect(onSettingsClick).toHaveBeenCalled()
  })

  it('toggle le son', async () => {
    render(<Header onSettingsClick={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Couper le son'))
    expect(usePomodoroStore.getState().soundEnabled).toBe(false)
  })

  it('toggle le thème', async () => {
    render(<Header onSettingsClick={vi.fn()} />)
    await userEvent.click(screen.getByLabelText('Mode clair'))
    expect(usePomodoroStore.getState().theme).toBe('light')
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/components/Header/Header.test.tsx
```

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/Header/Header.tsx
import styles from './Header.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { requestNotificationPermission } from '../../utils/notifications'

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  const { soundEnabled, notificationsEnabled, theme, updateSettings } = usePomodoroStore()

  const toggleSound = () => {
    updateSettings({ soundEnabled: !soundEnabled })
  }

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission()
      if (granted) updateSettings({ notificationsEnabled: true })
    } else {
      updateSettings({ notificationsEnabled: false })
    }
  }

  const toggleTheme = () => {
    updateSettings({ theme: theme === 'dark' ? 'light' : 'dark' })
  }

  return (
    <header className={styles.header}>
      <button
        onClick={onSettingsClick}
        className={styles.iconBtn}
        aria-label="Paramètres"
      >
        ⚙
      </button>
      <div className={styles.right}>
        <button
          onClick={toggleSound}
          className={`${styles.iconBtn} ${!soundEnabled ? styles.inactive : ''}`}
          aria-label={soundEnabled ? 'Couper le son' : 'Activer le son'}
          title={soundEnabled ? 'Son activé' : 'Son désactivé'}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>
        <button
          onClick={toggleNotifications}
          className={`${styles.iconBtn} ${!notificationsEnabled ? styles.inactive : ''}`}
          aria-label={notificationsEnabled ? 'Désactiver les notifications' : 'Activer les notifications'}
          title={notificationsEnabled ? 'Notifications activées' : 'Notifications désactivées'}
        >
          {notificationsEnabled ? '🔔' : '🔕'}
        </button>
        <button
          onClick={toggleTheme}
          className={styles.iconBtn}
          aria-label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  )
}
```

```css
/* src/components/Header/Header.module.css */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.iconBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  font-size: 1.2rem;
  color: var(--text-muted);
  transition: background 0.2s ease, color 0.2s ease;
}

.iconBtn:hover {
  background: var(--btn-bg);
  color: var(--text);
}

.inactive {
  opacity: 0.4;
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/components/Header/Header.test.tsx
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/Header/
git commit -m "feat: add Header component with sound/notification/theme toggles"
```

---

## Task 10 : Panneau Settings

**Files:**
- Create: `src/components/Settings/Settings.tsx`
- Create: `src/components/Settings/Settings.module.css`
- Create: `src/components/Settings/Settings.test.tsx`

- [ ] **Step 1 : Écrire les tests**

```typescript
// src/components/Settings/Settings.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { Settings } from './Settings'

beforeEach(() => {
  usePomodoroStore.setState({
    workDuration: 25, shortBreakDuration: 5,
    longBreakDuration: 15, cyclesBeforeLongBreak: 4,
  })
})

describe('Settings', () => {
  it('affiche les valeurs actuelles dans les inputs', () => {
    render(<Settings onClose={vi.fn()} />)
    expect(screen.getByLabelText('Travail (min)')).toHaveValue(25)
    expect(screen.getByLabelText('Pause courte (min)')).toHaveValue(5)
  })

  it('enregistre les nouvelles valeurs au clic sur Enregistrer', async () => {
    const onClose = vi.fn()
    render(<Settings onClose={onClose} />)
    const input = screen.getByLabelText('Travail (min)')
    await userEvent.clear(input)
    await userEvent.type(input, '30')
    await userEvent.click(screen.getByText('Enregistrer'))
    expect(usePomodoroStore.getState().workDuration).toBe(30)
    expect(onClose).toHaveBeenCalled()
  })

  it('remet les valeurs par défaut au clic sur Valeurs par défaut', async () => {
    usePomodoroStore.setState({ workDuration: 45 })
    render(<Settings onClose={vi.fn()} />)
    await userEvent.click(screen.getByText('Valeurs par défaut'))
    expect(screen.getByLabelText('Travail (min)')).toHaveValue(25)
  })

  it('ferme au clic sur Annuler', async () => {
    const onClose = vi.fn()
    render(<Settings onClose={onClose} />)
    await userEvent.click(screen.getByText('Annuler'))
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2 : Vérifier que les tests échouent**

```bash
npx vitest run src/components/Settings/Settings.test.tsx
```

- [ ] **Step 3 : Implémenter le composant**

```typescript
// src/components/Settings/Settings.tsx
import { useState } from 'react'
import styles from './Settings.module.css'
import { usePomodoroStore } from '../../store/pomodoroStore'

interface SettingsProps {
  onClose: () => void
}

const DEFAULTS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
}

export function Settings({ onClose }: SettingsProps) {
  const store = usePomodoroStore()
  const [values, setValues] = useState({
    workDuration: store.workDuration,
    shortBreakDuration: store.shortBreakDuration,
    longBreakDuration: store.longBreakDuration,
    cyclesBeforeLongBreak: store.cyclesBeforeLongBreak,
  })

  const handleChange = (key: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(1, parseInt(e.target.value, 10) || 1)
      setValues((prev) => ({ ...prev, [key]: val }))
    }

  const handleSave = () => {
    store.updateSettings(values)
    onClose()
  }

  const handleReset = () => setValues(DEFAULTS)

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Paramètres</h2>

        <div className={styles.fields}>
          <label className={styles.field}>
            <span>Travail (min)</span>
            <input
              type="number" min="1" max="120"
              aria-label="Travail (min)"
              value={values.workDuration}
              onChange={handleChange('workDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Pause courte (min)</span>
            <input
              type="number" min="1" max="60"
              aria-label="Pause courte (min)"
              value={values.shortBreakDuration}
              onChange={handleChange('shortBreakDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Pause longue (min)</span>
            <input
              type="number" min="1" max="120"
              aria-label="Pause longue (min)"
              value={values.longBreakDuration}
              onChange={handleChange('longBreakDuration')}
            />
          </label>
          <label className={styles.field}>
            <span>Cycles avant longue pause</span>
            <input
              type="number" min="1" max="10"
              aria-label="Cycles avant longue pause"
              value={values.cyclesBeforeLongBreak}
              onChange={handleChange('cyclesBeforeLongBreak')}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.resetBtn} onClick={handleReset}>
            Valeurs par défaut
          </button>
          <div className={styles.rightActions}>
            <button className={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button className={styles.saveBtn} onClick={handleSave}>Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

```css
/* src/components/Settings/Settings.module.css */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 16px;
  backdrop-filter: blur(4px);
}

.panel {
  background: var(--surface);
  border-radius: 20px;
  padding: 28px 24px;
  width: 100%;
  max-width: 380px;
  box-shadow: var(--shadow);
}

.title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text);
}

.fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text);
  font-size: 0.95rem;
}

.field input {
  width: 72px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-track);
  background: var(--surface-elevated);
  color: var(--text);
  font-size: 1rem;
  text-align: center;
  outline: none;
  transition: border-color 0.2s ease;
}

.field input:focus {
  border-color: var(--color-work);
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28px;
  gap: 8px;
}

.rightActions {
  display: flex;
  gap: 8px;
}

.resetBtn {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-decoration: underline;
  padding: 4px;
}

.resetBtn:hover {
  color: var(--text);
}

.cancelBtn, .saveBtn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.2s ease;
}

.cancelBtn {
  background: var(--btn-bg);
  color: var(--text);
}

.cancelBtn:hover {
  background: var(--btn-hover);
}

.saveBtn {
  background: var(--color-work);
  color: #fff;
}

.saveBtn:hover {
  filter: brightness(1.1);
}
```

- [ ] **Step 4 : Vérifier que les tests passent**

```bash
npx vitest run src/components/Settings/Settings.test.tsx
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/Settings/
git commit -m "feat: add Settings panel with configurable durations"
```

---

## Task 11 : Assemblage App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1 : Écrire `src/App.tsx`**

```typescript
// src/App.tsx
import { useState, useEffect } from 'react'
import { usePomodoroStore } from './store/pomodoroStore'
import { useTimer } from './hooks/useTimer'
import { Timer } from './components/Timer/Timer'
import { Controls } from './components/Controls/Controls'
import { CycleIndicator } from './components/CycleIndicator/CycleIndicator'
import { Header } from './components/Header/Header'
import { Settings } from './components/Settings/Settings'
import styles from './App.module.css'
import './index.css'

export default function App() {
  const theme = usePomodoroStore((s) => s.theme)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useTimer()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className={styles.app}>
      <Header onSettingsClick={() => setSettingsOpen(true)} />
      <main className={styles.main}>
        <Timer />
        <CycleIndicator />
        <Controls />
      </main>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
```

- [ ] **Step 2 : Mettre à jour `src/main.tsx`**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 3 : Démarrer le dev server et vérifier visuellement**

```bash
npm run dev
```

Ouvrir http://localhost:5173. Vérifier :
- Timer SVG s'affiche avec "25:00" et label "Prêt"
- Boutons Start/Stop/Skip présents
- Cliquer Start → phase passe à "work", timer décrémente
- Cliquer ⚙ → panneau Settings s'ouvre
- Toggle son/notif/thème fonctionnent

- [ ] **Step 4 : Lancer tous les tests**

```bash
npx vitest run
```

Attendu : tous les tests PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: assemble App with all components and useTimer integration"
```

---

## Task 12 : PWA — Icônes et configuration

**Files:**
- Create: `public/logo.svg`
- Create: `pwa-assets.config.ts`
- Modify: `vite.config.ts` (icônes apple-touch-icon)

- [ ] **Step 1 : Créer le logo SVG source**

```xml
<!-- public/logo.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="#1a1a2e"/>
  <circle cx="50" cy="52" r="30" fill="none" stroke="#e94560" stroke-width="6" stroke-linecap="round"
    stroke-dasharray="150 40" transform="rotate(-90 50 52)"/>
  <text x="50" y="58" text-anchor="middle" fill="#e2e8f0"
    font-family="-apple-system, sans-serif" font-size="22" font-weight="700">25</text>
</svg>
```

- [ ] **Step 2 : Créer `pwa-assets.config.ts`**

```typescript
// pwa-assets.config.ts
import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
})
```

- [ ] **Step 3 : Générer les icônes PWA**

```bash
npx pwa-assets-generator --config pwa-assets.config.ts
```

Attendu : fichiers générés dans `public/icons/` (pwa-192x192.png, pwa-512x512.png, apple-touch-icon-180x180.png, etc.).

- [ ] **Step 4 : Mettre à jour `vite.config.ts` pour inclure apple-touch-icon et favicon**

Remplacer le bloc `manifest.icons` et ajouter `apple-touch-icon` :

```typescript
// vite.config.ts — bloc VitePWA complet
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icons/*.png'],
  manifest: {
    name: 'Pomodoro Timer',
    short_name: 'Pomodoro',
    description: 'Minuteur Pomodoro configurable',
    theme_color: '#1a1a2e',
    background_color: '#1a1a2e',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
}),
```

- [ ] **Step 5 : Ajouter les meta tags PWA dans `index.html`**

```html
<!-- Dans <head> de index.html, après <title> -->
<meta name="theme-color" content="#1a1a2e">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pomodoro">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/logo.svg" type="image/svg+xml">
```

- [ ] **Step 6 : Commit**

```bash
git add public/ pwa-assets.config.ts vite.config.ts index.html
git commit -m "feat: add PWA icons, manifest, and Apple meta tags"
```

---

## Task 13 : Build et vérification finale

- [ ] **Step 1 : Lancer tous les tests une dernière fois**

```bash
npx vitest run
```

Attendu : tous les tests PASS.

- [ ] **Step 2 : Build de production**

```bash
npm run build
```

Attendu : build sans erreurs ni warnings TypeScript bloquants.

- [ ] **Step 3 : Tester le build en local**

```bash
npx serve dist
```

Ouvrir http://localhost:3000 et vérifier :
- App fonctionne identiquement au dev
- Ouvrir DevTools > Application > Service Workers → voir le SW enregistré
- DevTools > Application > Manifest → afficher le manifest valide (nom, icônes, display: standalone)

- [ ] **Step 4 : Audit Lighthouse**

Dans Chrome DevTools > Lighthouse :
- Sélectionner "Progressive Web App" + "Performance"
- Cliquer "Generate report"
- Attendu : score PWA ≥ 90, pas d'erreurs critiques

- [ ] **Step 5 : Test mobile (Android)**

Sur Chrome Android :
- Ouvrir l'URL du serveur local (ou déployer sur Vercel/Netlify)
- Chrome propose "Ajouter à l'écran d'accueil"
- Installer et vérifier que l'app s'ouvre en mode standalone (sans barre de navigation Chrome)
- Vérifier les notifications et le son

- [ ] **Step 6 : Commit final**

```bash
git add -A
git commit -m "chore: verified production build and PWA compliance"
```
