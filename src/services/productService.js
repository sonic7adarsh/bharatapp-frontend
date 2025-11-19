import axios from '../lib/axios'
import { generateProducts, generateCategories } from '../lib/mock'

const productService = {
  async getProducts(params = {}) {
    try {
      const { data } = await axios.get('/api/storefront/products', { params })
      return data
    } catch (e) {
      return generateProducts(8)
    }
  },
  async getProductById(id) {
    try {
      const { data } = await axios.get(`/api/storefront/products/${id}`)
      return data
    } catch (e) {
      const products = generateProducts(10)
      return products.find(p => p.id === id) || products[0]
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
    try {
      const { data } = await axios.get('/categories.json')
      const local = normalize(data)
      if (local.length) return local
    } catch {}
    return normalize(generateCategories())
  }
}

export default productService