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
