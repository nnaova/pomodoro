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
const mockNotification = Object.assign(vi.fn(), {
  permission: 'granted' as NotificationPermission,
  requestPermission: vi.fn().mockResolvedValue('granted' as NotificationPermission),
}) as unknown as typeof Notification & {
  permission: NotificationPermission
  requestPermission: () => Promise<NotificationPermission>
}
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

  it("ne joue pas de son pour la phase idle", () => {
    playPhaseEndSound('idle')
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled()
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
  const mockShowNotification = vi.fn()
  const mockRegistration = { showNotification: mockShowNotification }

  beforeEach(() => {
    mockShowNotification.mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })
  })

  it('utilise le service worker pour envoyer la notification si disponible', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(mockRegistration) },
      configurable: true,
    })
    await sendPhaseNotification('work')
    expect(mockShowNotification).toHaveBeenCalledWith(
      'Pause !',
      expect.objectContaining({ body: expect.any(String), icon: '/pwa-192x192.png' })
    )
    expect(mockNotification).not.toHaveBeenCalled()
  })

  it('utilise new Notification() en fallback si pas de service worker enregistré', async () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistration: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
    await sendPhaseNotification('work')
    expect(mockNotification).toHaveBeenCalledWith(
      'Pause !',
      expect.objectContaining({ body: expect.any(String), icon: '/pwa-192x192.png' })
    )
  })

  it('utilise new Notification() en fallback si serviceWorker absent', async () => {
    await sendPhaseNotification('shortBreak')
    expect(mockNotification).toHaveBeenCalledWith(
      'Au travail !',
      expect.objectContaining({ body: expect.any(String), icon: '/pwa-192x192.png' })
    )
  })

  it("ne propage pas d'exception si new Notification() throw", async () => {
    mockNotification.mockImplementationOnce(() => {
      throw new TypeError('Illegal constructor')
    })
    await expect(sendPhaseNotification('work')).resolves.toBeUndefined()
  })

  it("n'envoie pas de notification si permission non accordée", async () => {
    mockNotification.permission = 'denied'
    await sendPhaseNotification('work')
    expect(mockNotification).not.toHaveBeenCalled()
  })
})
