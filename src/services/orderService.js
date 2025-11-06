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
        totals: payload?.totals,
        createdAt: new Date().toISOString(),
        items: (payload?.items || []).map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        paymentMethod: payload?.paymentMethod || 'cod',
        paymentInfo: payload?.paymentInfo || null,
        transactionId: (payload?.paymentMethod === 'online')
          ? (payload?.paymentInfo?.transactionId || payload?.paymentInfo?.paymentId || payload?.paymentInfo?.reference || payload?.paymentInfo?.orderId || null)
          : null,
        // Delivery details
        address: payload?.address || null,
        deliverySlot: payload?.deliverySlot || null,
        deliveryInstructions: payload?.deliveryInstructions || '',
        promo: payload?.promo || undefined,
        // Preserve booking-specific metadata for hospitality
        type: payload?.type || 'order',
        booking: payload?.booking,
        guest: payload?.guest,
        room: payload?.room,
        store: payload?.store,
        notes: payload?.notes,
      }
      try {
        const isBooking = String(order.type || 'order') === 'room_booking'
        const key = isBooking ? 'bookings' : 'orders'
        const saved = localStorage.getItem(key)
        const list = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        list.unshift(order)
        localStorage.setItem(key, JSON.stringify(list))
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
        // Filter out room bookings if mixed data exists
        const filtered = orders.filter(o => String(o?.type || 'order') !== 'room_booking')
        if (filtered.length > 0) return filtered
      } catch {}
      return generateOrders(5)
    }
  },
  async getBookings() {
    try {
      const { data } = await axios.get('/api/storefront/bookings')
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('bookings')
        const bookings = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        if (bookings.length > 0) return bookings
        // Migration: extract bookings from mixed 'orders' if present
        const ordersSaved = localStorage.getItem('orders')
        const mixed = Array.isArray(ordersSaved ? JSON.parse(ordersSaved) : null) ? JSON.parse(ordersSaved) : []
        const extracted = mixed.filter(o => String(o?.type) === 'room_booking')
        if (extracted.length > 0) {
          localStorage.setItem('bookings', JSON.stringify(extracted))
          // Optionally, write back filtered orders to keep stores separated
          const remaining = mixed.filter(o => String(o?.type || 'order') !== 'room_booking')
          localStorage.setItem('orders', JSON.stringify(remaining))
          return extracted
        }
      } catch {}
      return []
    }
  }
}

export default orderService