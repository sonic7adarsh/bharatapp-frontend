import axios from '../lib/axios'

// Ensure a stable guest id for unauthenticated carts
function getGuestId() {
  try {
    const existing = localStorage.getItem('guest_id')
    if (existing) return existing
    const gid = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('guest_id', gid)
    return gid
  } catch {
    return `guest_${Date.now()}`
  }
}

function withGuestHeaders(config = {}) {
  const headers = { ...(config.headers || {}), 'X-Guest-Id': getGuestId() }
  return { ...config, headers }
}

const cartService = {
  async getCart() {
    try {
      const { data } = await axios.get('/api/storefront/cart', withGuestHeaders())
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('cart')
        const cart = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        if (cart.length > 0) return cart
      } catch {}
      return { items: [], total: 0, itemCount: 0 }
    }
  },
  async addToCart(item) {
    try {
      // Prefer storefront payload shape: productId, quantity (+ optional storeId)
      const body = {
        productId: item.id || item.productId,
        quantity: Number(item.quantity || 1),
      }
      if (typeof item.storeId !== 'undefined' && item.storeId !== null) body.storeId = item.storeId
      const { data } = await axios.post('/api/storefront/cart/items', body, withGuestHeaders())
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('cart')
        const cart = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const idx = cart.findIndex(c => c.id === item.id)
        if (idx >= 0) {
          cart[idx].quantity = (cart[idx].quantity || 1) + (item.quantity || 1)
          // Preserve pharmacy flag if provided
          if (item.requiresPrescription) cart[idx].requiresPrescription = true
          if (typeof item.storeId !== 'undefined') cart[idx].storeId = item.storeId
        } else {
          cart.push({ id: item.id, name: item.name, price: item.price, quantity: item.quantity || 1, requiresPrescription: !!item.requiresPrescription, storeId: item.storeId || null })
        }
        localStorage.setItem('cart', JSON.stringify(cart))
        return cart
      } catch {
        return { items: [], total: 0, itemCount: 0 }
      }
    }
  },
  async updateItemQuantity(itemId, quantity) {
    try {
      const { data } = await axios.patch(`/api/storefront/cart/items/${encodeURIComponent(itemId)}`, { quantity: Number(quantity || 1) }, withGuestHeaders())
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('cart')
        const cart = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const next = cart.map(c => c.id === itemId ? { ...c, quantity: Number(quantity || 1) } : c).filter(c => c.quantity > 0)
        localStorage.setItem('cart', JSON.stringify(next))
        return next
      } catch {
        return []
      }
    }
  },
  async removeFromCart(itemId) {
    try {
      const { data } = await axios.delete(`/api/storefront/cart/items/${encodeURIComponent(itemId)}`, withGuestHeaders())
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('cart')
        const cart = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const next = cart.filter(c => c.id !== itemId)
        localStorage.setItem('cart', JSON.stringify(next))
        return next
      } catch {
        return []
      }
    }
  },
  async clearCart() {
    try {
      const { data } = await axios.delete('/api/storefront/cart', withGuestHeaders())
      return data
    } catch (e) {
      try {
        localStorage.removeItem('cart')
        return []
      } catch {
        return []
      }
    }
  }
}

export default cartService