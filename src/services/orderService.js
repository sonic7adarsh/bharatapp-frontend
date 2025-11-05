import axios from '../lib/axios'
import { generateOrders } from '../lib/mock'

const orderService = {
  async checkout(payload) {
    try {
      const { data } = await axios.post('/api/storefront/checkout', payload)
      return data
    } catch (e) {
      const reference = `MOCK-${Math.floor(Math.random() * 900000) + 100000}`
      const total = payload?.totals?.payable ?? 0
      const order = {
        id: `order_${Date.now()}`,
        reference,
        status: 'placed',
        total,
        createdAt: new Date().toISOString(),
        items: (payload?.items || []).map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        paymentMethod: payload?.paymentMethod || 'cod',
        // Preserve booking-specific metadata for hospitality
        type: payload?.type || 'order',
        booking: payload?.booking,
        guest: payload?.guest,
        room: payload?.room,
        store: payload?.store,
        notes: payload?.notes,
      }
      try {
        const saved = localStorage.getItem('orders')
        const orders = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        orders.unshift(order)
        localStorage.setItem('orders', JSON.stringify(orders))
      } catch {}
      return { success: true, order }
    }
  },
  async getOrders() {
    try {
      const { data } = await axios.get('/api/storefront/orders')
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('orders')
        const orders = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        if (orders.length > 0) return orders
      } catch {}
      return generateOrders(5)
    }
  }
}

export default orderService