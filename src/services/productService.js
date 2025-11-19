import axios from '../lib/axios'

const productService = {
  async getProducts(params = {}) {
    try {
      const { data } = await axios.get('/api/storefront/products', { params })
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.error('getProducts failed:', e)
      return []
    }
  },
  async getProductById(id) {
    try {
      const { data } = await axios.get(`/api/storefront/products/${id}`)
      return data
    } catch (e) {
      console.error('getProductById failed:', e)
      return null
    }
  },
  async getCategories() {
    // Try primary REST API, then legacy path, then public JSON, then mock
    const normalize = (arr) => {
      const list = Array.isArray(arr) ? arr : []
      const cleaned = list
        .map((c) => (typeof c === 'string' ? c.trim() : String(c?.name || c?.label || '').trim()))
        .filter((c) => !!c)
      // Deduplicate and sort for stable UX
      return Array.from(new Set(cleaned)).sort((a, b) => a.localeCompare(b))
    }
    try {
      const { data } = await axios.get('/api/categories')
      const primary = normalize(data)
      if (primary.length) return primary
    } catch {}
    try {
      const { data } = await axios.get('/api/storefront/categories')
      const legacy = normalize(data)
      if (legacy.length) return legacy
    } catch {}
    return []
  }
}

export default productService