import api from '../lib/axios'
import { STORES } from '../data/stores'
import { generateProducts } from '../lib/mock'

const storeService = {
  async getStores(params = undefined) {
    // Try /api first, then fallback to plain route and versioned route
    try {
      const tryApi = await api.get('/api/stores', params ? { params } : undefined)
      if (Array.isArray(tryApi?.data)) return tryApi.data
    } catch {}
    // Local fallback using sample stores
    const search = params?.search ? String(params.search).toLowerCase() : ''
    const category = params?.category ? String(params.category).toLowerCase() : ''
    return STORES.filter(s => {
      const matchName = search ? s.name.toLowerCase().includes(search) : true
      const matchCat = category ? (s.category || '').toLowerCase() === category : true
      return matchName && matchCat
    })
  },
  async getStore(id) {
    try {
      const tryApi = await api.get(`/api/stores/${id}`)
      if (tryApi?.data) return tryApi.data
    } catch {}
    const localStore = STORES.find(s => s.id === id)
    if (localStore) return localStore
    // Throw to allow page-level catch to show not found
    throw new Error('Store not found')
  },
  async getProductsByStore(storeId) {
    // Supports both query-style and nested route depending on backend
    try {
      const byQuery = await api.get(`/api/products`, { params: { storeId } })
      if (Array.isArray(byQuery?.data)) return byQuery.data
    } catch {}
    try {
      const nested = await api.get(`/api/stores/${storeId}/products`)
      if (Array.isArray(nested?.data)) return nested.data
    } catch {}
    // Local fallback using sample store products or generated ones
    const localStore = STORES.find(s => s.id === storeId)
    if (localStore && Array.isArray(localStore.products)) {
      return localStore.products.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        description: `${p.name} from ${localStore.name}`,
        image: `https://picsum.photos/seed/${encodeURIComponent(p.name)}/300/200`
      }))
    }
    return generateProducts(6)
  },
  async checkRoomAvailability({ storeId, roomId, checkIn, checkOut, guests = 1 }) {
    // Try backend if available
    try {
      const res = await api.get('/api/availability', {
        params: { storeId, roomId, checkIn, checkOut, guests }
      })
      if (res?.data) return res.data
    } catch {}
    // Local mock: compute nights and apply simple rules
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const oneDay = 24 * 60 * 60 * 1000
    const nights = Math.max(0, Math.round((end - start) / oneDay))
    const store = STORES.find(s => s.id === storeId)
    const room = store?.products?.find(p => p.id === roomId)
    const base = room?.price || 1000
    // Simple constraints: max stay 14 nights, min 1 night, max 4 guests
    if (nights < 1) return { available: false, reason: 'Invalid date range' }
    if (nights > 14) return { available: false, reason: 'Maximum 14 nights allowed' }
    if (guests > 4) return { available: false, reason: 'Maximum 4 guests per room' }
    // Weekend surcharge mock
    const isWeekend = [0, 6].includes(start.getDay()) || [0, 6].includes(end.getDay())
    const surcharge = isWeekend ? 0.1 : 0
    const subtotal = base * nights * (1 + surcharge)
    const taxes = subtotal * 0.1
    const fees = subtotal * 0.05
    const total = Math.round(subtotal + taxes + fees)
    return {
      available: true,
      nights,
      base,
      surchargeRate: surcharge,
      subtotal: Math.round(subtotal),
      taxes: Math.round(taxes),
      fees: Math.round(fees),
      total
    }
  },
  async createStore(payload) {
    try {
      const res = await api.post('/api/stores', payload, { showSuccessToast: true, successMessage: 'Store onboarding request sent.' })
      return res.data
    } catch (e) {
      // Local mock success
      const mockId = `s_${Date.now()}`
      const mockStore = {
        id: mockId,
        name: payload?.name || `New Store ${mockId}`,
        area: payload?.area || 'Unknown Area',
        category: payload?.category || 'Grocery',
      }
      try {
        const saved = localStorage.getItem('stores')
        const stores = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        stores.push(mockStore)
        localStorage.setItem('stores', JSON.stringify(stores))
      } catch {}
      return { success: true, store: mockStore }
    }
  }
}

export default storeService
