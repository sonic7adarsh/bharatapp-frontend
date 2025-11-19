import axios from '../lib/axios'
import { generateOrders } from '../lib/mock'

const orderService = {
  async checkout(payload) {
    try {
      const { data } = await axios.post('/api/storefront/checkout', payload, { showSuccessToast: true, successMessage: 'Order placed.' })
      return data
    } catch (e) {
      // Backend-only: do not fabricate local orders/bookings
      throw e
    }
  },
  async getOrders(params = {}) {
    try {
      const { data } = await axios.get('/api/storefront/orders', { params })
      return data
    } catch (e) {
      // Backend-only: return empty array on failure
      return []
    }
  },
  async getOrderById(idOrRef) {
    try {
      const id = encodeURIComponent(String(idOrRef))
      const { data } = await axios.get(`/api/storefront/orders/${id}`)
      return data
    } catch (e) {
      return null
    }
  },
  async getBookings(params = {}) {
    try {
      // Accept pagination and filter params to align with backend envelope
      const { data } = await axios.get('/api/storefront/bookings', { params })
      return data
    } catch (e) {
      // Backend-only: return empty array on failure
      return []
    }
  },
  async getBookingById(idOrRef) {
    try {
      const id = encodeURIComponent(String(idOrRef))
      const { data } = await axios.get(`/api/storefront/bookings/${id}`)
      return data
    } catch (e) {
      return null
    }
  }
}

export default orderService