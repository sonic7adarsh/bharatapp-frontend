import api from '../lib/axios'

const productService = {
  async getProducts(params = {}) {
    try {
      const response = await api.get('/api/products', { params })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('getProducts failed:', error)
      return []
    }
  },

  async getProductById(id) {
    try {
      const response = await api.get(`/api/products/${id}`)
      return response.data
    } catch (error) {
      console.error('getProductById failed:', error)
      return null
    }
  },

  async createProduct(productData) {
    try {
      const response = await api.post('/api/products', productData, {
        showSuccessToast: true,
        successMessage: 'Product created successfully!'
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create product')
    }
  },

  async updateProductInventory(productId, stock) {
    try {
      const response = await api.patch(`/api/products/${productId}/inventory`, { stock })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update inventory')
    }
  },

  async bulkUpdateInventory(updates) {
    try {
      const response = await api.patch('/api/products/bulk-inventory', { updates })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update inventory')
    }
  },

  async getLowStockProducts(params = {}) {
    try {
      const response = await api.get('/api/products/low-stock', { params })
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('getLowStockProducts failed:', error)
      return []
    }
  },

  async getCategories() {
    // Get unique categories from products
    try {
      const products = await this.getProducts()
      const categories = [...new Set(products.map(p => p.category))]
      return categories.sort()
    } catch (error) {
      console.error('getCategories failed:', error)
      return []
    }
  }
}

export default productService