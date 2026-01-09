import api from '../lib/axios'

const riderService = {
  async register(riderData) {
    try {
      const response = await api.post('/api/riders/register', riderData, {
        showSuccessToast: true,
        successMessage: 'Rider registration successful!'
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Rider registration failed')
    }
  },

  async login(phone, otp) {
    try {
      const response = await api.post('/api/riders/login', { phone, otp })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Rider login failed')
    }
  },

  async updateLocation(latitude, longitude, accuracy = 5) {
    try {
      const response = await api.patch('/api/riders/location', {
        latitude,
        longitude,
        accuracy
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update location')
    }
  },

  async updateAvailability(isAvailable) {
    try {
      const response = await api.patch('/api/riders/availability', {
        isAvailable
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update availability')
    }
  },

  async acceptOrder(orderId) {
    try {
      const response = await api.patch(`/api/riders/orders/${orderId}/accept`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to accept order')
    }
  },

  async updateOrderStatus(orderId, status, note = '') {
    try {
      const response = await api.patch(`/api/riders/orders/${orderId}/status`, {
        status,
        note
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update order status')
    }
  },

  async getEarnings(params = {}) {
    try {
      const response = await api.get('/api/riders/earnings', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch earnings')
    }
  },

  async getOrders(params = {}) {
    try {
      const response = await api.get('/api/riders/orders', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch rider orders')
    }
  },

  async getPendingOrders(params = {}) {
    try {
      const response = await api.get('/api/orders/pending/rider', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch pending orders')
    }
  }
}

export default riderService