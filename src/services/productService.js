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
    try {
      const { data } = await axios.get('/api/storefront/categories')
      return data
    } catch (e) {
      return generateCategories()
    }
  }
}

export default productService