import axios from '../lib/axios'
import { generateCart } from '../lib/mock'

const cartService = {
  async getCart() {
    try {
      const { data } = await axios.get('/store/cart')
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('cart')
        const cart = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        if (cart.length > 0) return cart
      } catch {}
      return generateCart()
    }
  },
  async addToCart(item) {
    try {
      const { data } = await axios.post('/store/cart/add', item)
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
        } else {
          cart.push({ id: item.id, name: item.name, price: item.price, quantity: item.quantity || 1, requiresPrescription: !!item.requiresPrescription })
        }
        localStorage.setItem('cart', JSON.stringify(cart))
        return cart
      } catch {
        return generateCart()
      }
    }
  },
  async removeFromCart(itemId) {
    try {
      const { data } = await axios.delete(`/store/cart/${itemId}`)
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
  }
}

export default cartService