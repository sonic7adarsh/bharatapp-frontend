import axios from '../lib/axios'
import { generateUser } from '../lib/mock'

const authService = {
  async register(payload) {
    try {
      const { data } = await axios.post('/api/storefront/auth/register', payload)
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
      const user = generateUser()
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
      const user = generateUser()
      const token = `mock-${Date.now()}`
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