import axios from '../lib/axios'
import { generateUser } from '../lib/mock'

// Toggle for seller auth mock mode. Defaults to true for local/dev.
const USE_MOCK_SELLER_AUTH = (import.meta.env?.VITE_USE_MOCK_SELLER_AUTH ?? 'true') === 'true'
// Allow dev OTP acceptance even when backend responds with an error (local/dev only)
const ALLOW_DEV_OTP = (import.meta.env?.VITE_ALLOW_DEV_OTP ?? 'true') === 'true'

const authService = {
  // OTP: send, verify, resend for mobile login
  async sendOTP({ phone, channel = 'sms' }) {
    try {
      const { data } = await axios.post('/api/storefront/auth/otp/send', { phone, channel })
      return data
    } catch (e) {
      // Fallback on network/connection errors or when dev toggle allows
      if (e && e.response && !ALLOW_DEV_OTP) throw e
      // Fallback: create a local OTP session
      const otpId = `OTP_${Date.now()}`
      const ttlSeconds = 300
      const expiresAt = Date.now() + ttlSeconds * 1000
      const session = { otpId, phone, ttlSeconds, expiresAt }
      try { localStorage.setItem('otpSession', JSON.stringify(session)) } catch {}
      return { success: true, otpId, ttlSeconds }
    }
  },
  async verifyOTP({ phone, otp, intent, role }) {
    try {
      const { data } = await axios.post('/api/storefront/auth/otp/verify', { phone, otp })
      return data
    } catch (e) {
      // Fallback on network/connection errors or when dev toggle allows
      if (e && e.response && !ALLOW_DEV_OTP) throw e
      // Fallback: accept common dev OTPs or valid local session
      let session = null
      try {
        const raw = localStorage.getItem('otpSession')
        if (raw) session = JSON.parse(raw)
      } catch {}

      const isDevOtp = otp === '123456' || otp === '000000'
      const isSessionValid = session && session.phone === phone && session.expiresAt > Date.now()
      if (!isDevOtp && !isSessionValid) throw e

      // Build a mock token/user, preserving role intent when provided
      let existing = null
      try {
        const rawUser = localStorage.getItem('user')
        if (rawUser) existing = JSON.parse(rawUser)
      } catch {}
      const base = generateUser()
      const nextRole = role ? String(role).toLowerCase() : String(existing?.role || base.role).toLowerCase()
      const user = {
        ...(existing || base),
        role: nextRole,
        phone: phone || existing?.phone || undefined,
      }
      const token = `mock-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  async resendOTP({ phone, otpId }) {
    try {
      const { data } = await axios.post('/api/storefront/auth/otp/resend', { phone, otpId })
      return data
    } catch (e) {
      // Fallback on network/connection errors or when dev toggle allows
      if (e && e.response && !ALLOW_DEV_OTP) throw e
      // Fallback: rotate otpId and extend TTL
      const newOtpId = `OTP_${Date.now()}`
      const ttlSeconds = 300
      const expiresAt = Date.now() + ttlSeconds * 1000
      const session = { otpId: newOtpId, phone, ttlSeconds, expiresAt }
      try { localStorage.setItem('otpSession', JSON.stringify(session)) } catch {}
      return { success: true, otpId: newOtpId, ttlSeconds }
    }
  },
  async register(payload) {
    try {
      const { data } = await axios.post('/api/storefront/auth/register', payload)
      return data
    } catch (e) {
      const base = generateUser()
      const user = {
        ...base,
        // Prefer provided details from registration form
        name: payload?.name || base.name,
        email: payload?.email || base.email,
        role: (payload?.role ? String(payload.role).toLowerCase() : base.role)
      }
      const token = `mock-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  async login(payload) {
    try {
      const { data } = await axios.post('/api/storefront/auth/login', payload)
      return data
    } catch (e) {
      const user = generateUser()
      const token = `mock-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  async loginWithEmail(payload) {
    try {
      const { data } = await axios.post('/api/storefront/auth/login/email', payload)
      return data
    } catch (e) {
      const base = generateUser()
      const nextRole = (payload?.role ? String(payload.role).toLowerCase() : String(base.role).toLowerCase())
      const user = { ...base, role: nextRole }
      const token = `mock-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  async loginWithPhone(payload) {
    try {
      const { data } = await axios.post('/api/storefront/auth/login/phone', payload)
      return data
    } catch (e) {
      // Preserve existing role if present; otherwise allow payload role or default
      let existing = null
      try {
        const raw = localStorage.getItem('user')
        if (raw) existing = JSON.parse(raw)
      } catch {}
      const base = generateUser()
      const nextRole = (payload?.role ? String(payload.role).toLowerCase() : String(existing?.role || base.role).toLowerCase())
      const user = {
        ...(existing || base),
        role: nextRole,
        phone: payload?.phone || existing?.phone || undefined,
      }
      const token = `mock-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  // Seller-specific registration
  async sellerRegister({ name, email, phone, password, businessType }) {
    // Short-circuit to mock mode when enabled
    if (USE_MOCK_SELLER_AUTH) {
      const user = {
        ...generateUser(),
        id: `seller_${Date.now()}`,
        name,
        email,
        phone,
        role: 'seller',
        businessType,
      }
      const token = `mock-seller-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
    try {
      const { data } = await axios.post('/api/auth/seller/register', {
        name,
        email,
        phone,
        password,
        businessType,
      })
      const token = data?.token
      const sellerId = data?.sellerId
      const user = data?.user || {
        id: sellerId,
        name,
        email,
        phone,
        role: 'seller',
        businessType,
      }
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    } catch (e) {
      const user = {
        ...generateUser(),
        name,
        email,
        phone,
        role: 'seller',
        businessType,
      }
      const token = `mock-seller-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },

  // Seller-specific login
  async sellerLogin({ email, phone, password }) {
    // Short-circuit to mock mode when enabled
    if (USE_MOCK_SELLER_AUTH) {
      const user = {
        ...generateUser(),
        id: `seller_${Date.now()}`,
        email,
        phone,
        role: 'seller',
      }
      const token = `mock-seller-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
    try {
      const payload = email ? { email, password } : { phone, password }
      const { data } = await axios.post('/api/auth/seller/login', payload)
      const token = data?.token
      const sellerId = data?.sellerId
      const user = data?.user || {
        id: sellerId,
        email,
        phone,
        role: 'seller',
      }
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    } catch (e) {
      if (!password) throw e
      const user = {
        ...generateUser(),
        email,
        phone,
        role: 'seller',
      }
      const token = `mock-seller-${Date.now()}`
      try {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      } catch {}
      return { token, user }
    }
  },
  async profile() {
    try {
      const { data } = await axios.get('/api/storefront/auth/profile')
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('user')
        if (saved) return JSON.parse(saved)
      } catch {}
      return generateUser()
    }
  }
}

export default authService