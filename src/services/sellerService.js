import axios from '../lib/axios'
import { generateOrders } from '../lib/mock'

// Minimal seller API wrapper following conventions used elsewhere
const sellerService = {
  // Stores owned by the seller
  async getSellerStores(params = {}) {
    try {
      const { data } = await axios.get('/api/seller/stores', { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      // Local fallback: read stores created during onboarding
      try {
        const saved = localStorage.getItem('stores')
        const stores = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        return stores
      } catch {}
      return []
    }
  },
  async createStore(payload) {
    let body = payload
    // If documents or files are present, use FormData
    if (payload?.documents || payload?.businessCertificate || payload?.addressProof || payload?.licenseFile) {
      const formData = new FormData()
      const entries = Object.entries(payload || {})
      for (const [k, v] of entries) {
        if (v == null) continue
        if (k === 'documents' && typeof v === 'object') {
          for (const [dk, dv] of Object.entries(v)) {
            if (dv != null) formData.append(`documents.${dk}`, dv)
          }
        } else {
          formData.append(k, v)
        }
      }
      body = formData
    }
    try {
      const { data } = await axios.post('/api/seller/stores', body, { showSuccessToast: true, successMessage: 'Store created successfully.' })
      return data
    } catch (e) {
      // Local mock success: persist minimal store data and elevate role to seller
      const mockId = `s_${Date.now()}`
      const mockStore = {
        id: mockId,
        name: payload?.name || `New Store ${mockId}`,
        area: payload?.area || 'Unknown Area',
        city: payload?.city || '',
        address: payload?.address || '',
        phone: payload?.phone || '',
        pincode: payload?.pincode || '',
        category: payload?.category || 'Grocery',
        type: payload?.type || 'Store',
        description: payload?.description || '',
      }
      try {
        const saved = localStorage.getItem('stores')
        const stores = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        stores.push(mockStore)
        localStorage.setItem('stores', JSON.stringify(stores))
        // Elevate current user to seller after onboarding
        const rawUser = localStorage.getItem('user')
        if (rawUser) {
          const u = JSON.parse(rawUser)
          const next = { ...u, role: 'seller' }
          localStorage.setItem('user', JSON.stringify(next))
        }
      } catch {}
      return { success: true, store: mockStore }
    }
  },
  async updateStore(storeId, payload) {
    try {
      const { data } = await axios.patch(`/api/seller/stores/${storeId}`, payload, { showSuccessToast: true, successMessage: 'Store updated.' })
      return data
    } catch (e) {
      // Local fallback: update store in localStorage if present
      try {
        const raw = localStorage.getItem('stores')
        const list = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
        const idx = list.findIndex(s => String(s.id || s._id) === String(storeId))
        if (idx >= 0) {
          const next = { ...list[idx], ...payload }
          list[idx] = next
          localStorage.setItem('stores', JSON.stringify(list))
          return next
        }
      } catch {}
      // If not found locally, return payload as acknowledgment
      return payload
    }
  },

  // Products
  async getStoreProducts(storeId, params = {}) {
    try {
      const { data } = await axios.get(`/api/seller/stores/${storeId}/products`, { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      // Local fallback: read products stored via createProduct mock
      try {
        const key = `seller_products_${storeId}`
        const saved = localStorage.getItem(key)
        const products = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        return products
      } catch {}
      return []
    }
  },
  async createProduct(storeId, payload) {
    let body = payload
    if (payload?.imageFile) {
      const formData = new FormData()
      formData.append('name', payload.name)
      formData.append('price', payload.price)
      formData.append('description', payload.description)
      formData.append('category', payload.category)
      formData.append('image', payload.imageFile)
      body = formData
    }
    try {
      const { data } = await axios.post(`/api/seller/stores/${storeId}/products`, body, { showSuccessToast: true, successMessage: 'Product added successfully.' })
      return data
    } catch (e) {
      // Local fallback: persist seller product per store
      const id = `prod_${Date.now()}`
      let imageDataUrl = ''
      try {
        if (payload?.imageFile) {
          const reader = new FileReader()
          imageDataUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(String(reader.result || ''))
            reader.onerror = () => resolve('')
            reader.readAsDataURL(payload.imageFile)
          })
        }
      } catch {}
      const { imageFile, ...rest } = payload || {}
      const product = { id, ...rest, imageDataUrl, storeId }
      try {
        const key = `seller_products_${storeId}`
        const saved = localStorage.getItem(key)
        const products = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        products.unshift(product)
        localStorage.setItem(key, JSON.stringify(products))
      } catch {}
      return { success: true, product }
    }
  },
  async updateProduct(productId, payload) {
    try {
      const { data } = await axios.patch(`/api/seller/products/${productId}`, payload, { showSuccessToast: true, successMessage: 'Product updated.' })
      return data
    } catch (e) {
      // Local fallback: update product across any store list in localStorage
      try {
        const keys = Object.keys(localStorage)
        for (const k of keys) {
          if (!k.startsWith('seller_products_')) continue
          const raw = localStorage.getItem(k)
          const list = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
          const idx = list.findIndex(p => (p.id || p._id) === productId)
          if (idx >= 0) {
            const next = { ...list[idx], ...payload }
            list[idx] = next
            localStorage.setItem(k, JSON.stringify(list))
            return next
          }
        }
      } catch {}
      return payload
    }
  },
  async deleteProduct(productId) {
    try {
      const { data } = await axios.delete(`/api/seller/products/${productId}`, { showSuccessToast: true, successMessage: 'Product deleted.' })
      return data
    } catch (e) {
      // Local fallback: remove product from any seller_products_<storeId> list
      try {
        const keys = Object.keys(localStorage)
        for (const k of keys) {
          if (!k.startsWith('seller_products_')) continue
          const raw = localStorage.getItem(k)
          const list = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
          const next = list.filter(p => (p.id || p._id) !== productId)
          if (next.length !== list.length) {
            localStorage.setItem(k, JSON.stringify(next))
          }
        }
      } catch {}
      return { success: true }
    }
  },
  async updateInventory(productId, payload) {
    try {
      const { data } = await axios.patch(`/api/seller/products/${productId}/inventory`, payload, { showSuccessToast: true, successMessage: 'Inventory updated.' })
      return data
    } catch (e) {
      // Local fallback: update inventory on any matching product across seller_products_* lists
      try {
        const keys = Object.keys(localStorage)
        for (const k of keys) {
          if (!k.startsWith('seller_products_')) continue
          const raw = localStorage.getItem(k)
          const list = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
          const idx = list.findIndex(p => (p.id || p._id) === productId)
          if (idx >= 0) {
            const next = { ...list[idx], ...payload }
            list[idx] = next
            localStorage.setItem(k, JSON.stringify(list))
            return next
          }
        }
      } catch {}
      return payload
    }
  },

  // Orders
  async getOrders(params = {}) {
    try {
      const { data } = await axios.get('/api/seller/orders', { params })
      return Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []
    } catch (e) {
      // Fallback: local seller orders if present, otherwise storefront orders, otherwise mock
      try {
        const rawSeller = localStorage.getItem('seller_orders')
        const sellerOrders = Array.isArray(rawSeller ? JSON.parse(rawSeller) : null) ? JSON.parse(rawSeller) : []
        if (sellerOrders.length > 0) return sellerOrders
      } catch {}
      try {
        const raw = localStorage.getItem('orders')
        const orders = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
        const filtered = orders.filter(o => String(o?.type || 'order') !== 'room_booking')
        if (filtered.length > 0) return filtered
      } catch {}
      return generateOrders(5)
    }
  },
  async getOrder(orderId) {
    try {
      const { data } = await axios.get(`/api/seller/orders/${orderId}`)
      return data
    } catch (e) {
      // Fallback: find in local orders
      try {
        const sources = []
        const rawSeller = localStorage.getItem('seller_orders')
        if (rawSeller) sources.push(JSON.parse(rawSeller))
        const raw = localStorage.getItem('orders')
        if (raw) sources.push(JSON.parse(raw))
        const orders = sources.flat().filter(Boolean)
        const found = orders.find(o => String(o.id || '').toLowerCase() === String(orderId).toLowerCase())
          || orders.find(o => String(o.reference || '').toLowerCase() === String(orderId).toLowerCase())
        return found || null
      } catch {}
      // Last resort: generate and attempt match
      const mock = generateOrders(5)
      return mock.find(o => String(o.id || '').toLowerCase() === String(orderId).toLowerCase()) || null
    }
  },
  async updateOrderStatus(orderId, payload) {
    try {
      const { data } = await axios.patch(`/api/seller/orders/${orderId}/status`, payload, { showSuccessToast: true, successMessage: 'Order status updated.' })
      return data
    } catch (e) {
      // Fallback: update local order status if present
      try {
        const sources = []
        const rawSeller = localStorage.getItem('seller_orders')
        if (rawSeller) sources.push(['seller_orders', JSON.parse(rawSeller)])
        const raw = localStorage.getItem('orders')
        if (raw) sources.push(['orders', JSON.parse(raw)])
        for (const [key, list] of sources) {
          const idx = Array.isArray(list) ? list.findIndex(o => (o.id || o.reference) === orderId) : -1
          if (idx >= 0) {
            const next = { ...list[idx], ...payload }
            list[idx] = next
            localStorage.setItem(key, JSON.stringify(list))
            return next
          }
        }
      } catch {}
      return { id: orderId, ...payload }
    }
  },
  async requestRefund(orderId, payload) {
    try {
      const { data } = await axios.post(`/api/seller/orders/${orderId}/refunds`, payload, { showSuccessToast: true, successMessage: 'Refund requested.' })
      return data
    } catch (e) {
      // Assume refund request recorded in mock mode
      return { success: true, orderId, ...payload }
    }
  },

  // Hospitality bookings
  async getBookings(params = {}) {
    try {
      const { data } = await axios.get('/api/seller/bookings', { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      try {
        const saved = localStorage.getItem('bookings')
        const bookings = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        return bookings
      } catch {}
      return []
    }
  },
  async getBooking(bookingId) {
    try {
      const { data } = await axios.get(`/api/seller/bookings/${bookingId}`)
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('bookings')
        const bookings = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const found = bookings.find(b => String(b.id || '').toLowerCase() === String(bookingId).toLowerCase())
        return found || null
      } catch {}
      return null
    }
  },
  async updateBookingStatus(bookingId, payload) {
    try {
      const { data } = await axios.patch(`/api/seller/bookings/${bookingId}/status`, payload, { showSuccessToast: true, successMessage: 'Booking status updated.' })
      return data
    } catch (e) {
      // Fallback: update local booking status if present
      try {
        const saved = localStorage.getItem('bookings')
        const bookings = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const idx = bookings.findIndex(b => (b.id || b.reference) === bookingId)
        if (idx >= 0) {
          const next = { ...bookings[idx], ...payload }
          bookings[idx] = next
          localStorage.setItem('bookings', JSON.stringify(bookings))
          return next
        }
      } catch {}
      return { id: bookingId, ...payload }
    }
  },

  // Payouts & settlement
  async getPayouts() {
    try {
      const { data } = await axios.get('/api/seller/payouts')
      return Array.isArray(data) ? data : []
    } catch (e) {
      try {
        const saved = localStorage.getItem('payouts')
        const payouts = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        return payouts
      } catch {}
      return []
    }
  },
  async requestPayout(payload) {
    try {
      const { data } = await axios.post('/api/seller/payouts/request', payload, { showSuccessToast: true, successMessage: 'Payout requested.' })
      return data
    } catch (e) {
      // Local fallback: append request into payouts list
      try {
        const saved = localStorage.getItem('payouts')
        const payouts = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const req = { id: 'payout_' + Date.now(), status: 'requested', ...payload }
        payouts.unshift(req)
        localStorage.setItem('payouts', JSON.stringify(payouts))
        return { success: true, payout: req }
      } catch {}
      return { success: true }
    }
  },
  async getPayoutConfig() {
    try {
      const { data } = await axios.get('/api/seller/payouts/config')
      return data
    } catch (e) {
      try {
        const saved = localStorage.getItem('payout_config')
        if (saved) return JSON.parse(saved)
      } catch {}
      return { method: 'upi', upiId: '', minThreshold: 0 }
    }
  },
  async updatePayoutConfig(payload) {
    try {
      const { data } = await axios.patch('/api/seller/payouts/config', payload, { showSuccessToast: true, successMessage: 'Payout config updated.' })
      return data
    } catch (e) {
      // Local fallback: merge and persist
      try {
        const saved = localStorage.getItem('payout_config')
        const base = saved ? JSON.parse(saved) : { method: 'upi', upiId: '' }
        const next = { ...base, ...payload }
        localStorage.setItem('payout_config', JSON.stringify(next))
        return next
      } catch {}
      return payload
    }
  },

  // Analytics
  async getOverviewAnalytics(params = {}) {
    try {
      const { data } = await axios.get('/api/seller/analytics/overview', { params })
      return data || {}
    } catch (e) {
      // Fallback: derive simple totals from local orders
      try {
        const raw = localStorage.getItem('orders')
        const orders = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0)
        const series = orders.map(o => ({ x: o.createdAt || new Date().toISOString(), y: o.total || 0 }))
        return { totals: { revenue: totalRevenue, orders: orders.length }, series }
      } catch {}
      return { totals: {}, series: [] }
    }
  },

  // Announcements
  async postAnnouncement(payload) {
    try {
      const { data } = await axios.post('/api/seller/announcements', payload, { showSuccessToast: true })
      return data
    } catch (e) {
      // Local fallback: persist announcements
      try {
        const saved = localStorage.getItem('announcements')
        const list = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        const next = { id: 'ann_' + Date.now(), ...payload }
        list.unshift(next)
        localStorage.setItem('announcements', JSON.stringify(list))
        return { success: true, announcement: next }
      } catch {}
      return { success: true }
    }
  }
}

export default sellerService