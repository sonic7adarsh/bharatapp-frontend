import axios from '../lib/axios'

const paymentService = {
  async initiatePayment({ amount, currency = 'INR', method = 'upi', address, phone }) {
    try {
      const payload = { amount, currency, method, address, phone }
      const { data } = await axios.post('/api/storefront/payments/initiate', payload, { showSuccessToast: true, successMessage: 'Payment initiated.' })
      // Expected shape:
      // { orderId, gateway: 'razorpay'|'native_upi'|'redirect', session: { key?, razorpayOrderId?, upiDeepLink?, redirectUrl? } }
      return data
    } catch (e) {
      throw new Error('Failed to initiate payment')
    }
  },
  async verifyPayment(payload) {
    try {
      const { data } = await axios.post('/api/storefront/payments/verify', payload, { showSuccessToast: true, successMessage: 'Payment verified.' })
      return data
    } catch (e) {
      throw new Error('Failed to verify payment')
    }
  }
}

export default paymentService