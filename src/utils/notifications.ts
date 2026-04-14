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
  if (phase === 'idle') return
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

export async function sendPhaseNotification(phase: Phase): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const msg = PHASE_MESSAGES[phase]
  if (!msg) return

  const options = { body: msg.body, icon: '/pwa-192x192.png' }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.showNotification(msg.title, options)
        return
      }
    }
    new Notification(msg.title, options)
  } catch {
    // Silently fail — not supported in this context (ex: mobile main thread)
  }
}
