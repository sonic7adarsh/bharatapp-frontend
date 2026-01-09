import api from '../lib/axios'

const authService = {
  async sendOTP(phone) {
    try {
      // Handle both object and parameter formats
      let phoneNumber
      if (typeof phone === 'object') {
        phoneNumber = phone.phone || phone.phoneNumber
      } else {
        phoneNumber = phone
      }
      
      console.log('Using real API for sendOTP:', phoneNumber)
      const response = await api.post('/api/mobile-auth/send-otp', { phone: phoneNumber })
      return response.data
    } catch (error) {
      console.error('sendOTP error:', error)
      throw new Error(error.response?.data?.error || 'Failed to send OTP')
    }
  },

  async verifyOTP(phone, otp) {
    try {
      // Handle both object and parameter formats
      let phoneNumber, otpCode
      if (typeof phone === 'object') {
        phoneNumber = phone.phone
        otpCode = phone.otp
      } else {
        phoneNumber = phone
        otpCode = otp
      }
      
      console.log('Using real API for verifyOTP:', { phone: phoneNumber, otp: otpCode })
      const response = await api.post('/api/mobile-auth/verify-otp', { phone: phoneNumber, otp: otpCode })
      return response.data
    } catch (error) {
      console.error('verifyOTP error:', error)
      throw new Error(error.response?.data?.error || 'Failed to verify OTP')
    }
  },

  async register(userData) {
    try {
      const response = await api.post('/api/auth/register', userData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
  },

  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  async loginWithEmail(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed')
    }
  },

  async loginWithPhone(payload) {
    try {
      const response = await api.post('/api/mobile-auth/verify-otp', payload)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Phone login failed')
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/api/auth/profile')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch profile')
    }
  },

  async updateProfile(data) {
    try {
      const response = await api.patch('/api/auth/profile', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update profile')
    }
  },

  async addAddress(address) {
    try {
      const response = await api.post('/api/auth/addresses', address)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add address')
    }
  },

  async getAddresses() {
    try {
      const response = await api.get('/api/auth/addresses')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch addresses')
    }
  }
}

export default authService