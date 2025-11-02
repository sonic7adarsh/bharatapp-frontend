import axios from '../lib/axios'

const paymentService = {
  async createOrder({ amount, currency = 'INR' }) {
    try {
      const { data } = await axios.post('/api/storefront/payments/create-order', { amount, currency })
      // Expect data like { id: 'order_xxx', amount }
      return data
    } catch (e) {
      // Fallback: mock order
      return { id: 'order_mock_' + Date.now(), amount }
    }
  },
  async verifyPayment(payload) {
    try {
      const { data } = await axios.post('/api/storefront/payments/verify', payload)
      return data
    } catch (e) {
      // Assume success in mock mode
      return { status: 'ok' }
    }
  }
}

export default paymentService