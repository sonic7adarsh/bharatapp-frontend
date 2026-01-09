import api from '../lib/axios'

const orderService = {
  async createOrder(payload) {
    try {
      const response = await api.post('/api/orders', payload, { 
        showSuccessToast: true, 
        successMessage: 'Order placed successfully!' 
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to place order')
    }
  },

  async getCustomerOrders(params = {}) {
    try {
      const response = await api.get('/api/orders/customer', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch orders')
    }
  },

  async getStoreOrders(params = {}) {
    try {
      const response = await api.get('/api/orders/store', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch store orders')
    }
  },

  async getOrderById(orderId) {
    try {
      const response = await api.get(`/api/orders/${orderId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch order details')
    }
  },

  async updateOrderStatus(orderId, status, note) {
    try {
      const response = await api.patch(`/api/orders/${orderId}/status`, { status, note })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update order status')
    }
  },

  async cancelOrder(orderId, reason) {
    try {
      const response = await api.patch(`/api/orders/${orderId}/cancel`, { reason }, {
        showSuccessToast: true,
        successMessage: 'Order cancelled successfully'
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to cancel order')
    }
  },

  // Rider-specific endpoints
  async getPendingOrdersForRider(params = {}) {
    try {
      const response = await api.get('/api/orders/pending/rider', { params })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch pending orders')
    }
  },

  async acceptOrderByRider(orderId) {
    try {
      const response = await api.patch(`/api/riders/orders/${orderId}/accept`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to accept order')
    }
  },

  async updateRiderOrderStatus(orderId, status, note) {
    try {
      const response = await api.patch(`/api/riders/orders/${orderId}/status`, { status, note })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update rider order status')
    }
  }
}

export default orderService