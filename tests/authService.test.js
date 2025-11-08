import { describe, it, expect, beforeEach, vi } from 'vitest'
import authService from '../src/services/authService'
import axios from '../src/lib/axios'

beforeEach(() => {
  vi.restoreAllMocks()
  // jsdom provides localStorage
  localStorage.clear()
})

describe('authService OTP fallbacks', () => {
  it('sendOTP falls back to local session when backend fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network'))
    const res = await authService.sendOTP({ phone: '+919876543210' })
    expect(res.success).toBe(true)
    const raw = localStorage.getItem('otpSession')
    expect(raw).toBeTruthy()
    const session = JSON.parse(raw)
    expect(session.phone).toBe('+919876543210')
    expect(session.otpId).toBeDefined()
    expect(session.expiresAt).toBeGreaterThan(Date.now())
  })

  it('verifyOTP accepts dev OTP when backend fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network'))
    const res = await authService.verifyOTP({ phone: '+919876543210', otp: '123456' })
    expect(res.token).toBeTruthy()
    expect(res.user).toBeTruthy()
    expect(res.user.phone).toBe('+919876543210')
  })

  it('verifyOTP accepts valid local session when backend fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network'))
    const ttlSeconds = 300
    const session = { otpId: 'OTP_TEST', phone: '+911234567890', ttlSeconds, expiresAt: Date.now() + ttlSeconds * 1000 }
    localStorage.setItem('otpSession', JSON.stringify(session))
    const res = await authService.verifyOTP({ phone: '+911234567890', otp: '654321' })
    expect(res.token).toBeTruthy()
    expect(res.user.phone).toBe('+911234567890')
  })

  it('verifyOTP rejects when backend fails and no dev otp or valid session', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network'))
    await expect(authService.verifyOTP({ phone: '+911234567890', otp: '222222' })).rejects.toThrow()
  })

  it('resendOTP rotates otpId in local session when backend fails', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network'))
    const res = await authService.resendOTP({ phone: '+919876543210', otpId: 'OTP_OLD' })
    expect(res.success).toBe(true)
    const raw = localStorage.getItem('otpSession')
    expect(raw).toBeTruthy()
    const session = JSON.parse(raw)
    expect(session.otpId).not.toBe('OTP_OLD')
    expect(session.phone).toBe('+919876543210')
  })
})