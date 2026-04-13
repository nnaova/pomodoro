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
