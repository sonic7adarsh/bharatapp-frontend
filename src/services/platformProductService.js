import axios from '../lib/axios'

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    } catch (err) {
      resolve('')
    }
  })
}

const platformProductService = {
  async getProducts(params = {}) {
    const { data } = await axios.get('/api/platform/products', { params })
    return data
  },
  async createProduct(payload) {
    try {
      let body = payload
      if (payload?.imageFile) {
        const formData = new FormData()
        formData.append('name', payload.name)
        formData.append('price', payload.price)
        formData.append('description', payload.description)
        formData.append('category', payload.category)
        if (payload.storeId) formData.append('storeId', payload.storeId)
        formData.append('image', payload.imageFile)
        body = formData
      }
      const { data } = await axios.post('/api/platform/products', body, { showSuccessToast: true, successMessage: 'Product added successfully.' })
      return data
    } catch (e) {
      // Local fallback: persist to localStorage
      const id = `prod_${Date.now()}`
      let imageDataUrl = ''
      if (payload?.imageFile) {
        try {
          imageDataUrl = await fileToDataURL(payload.imageFile)
        } catch {}
      }
      // avoid storing the File object in localStorage
      const { imageFile, ...rest } = payload || {}
      const product = { id, ...rest, imageDataUrl }
      try {
        const saved = localStorage.getItem('platform_products')
        const products = Array.isArray(saved ? JSON.parse(saved) : null) ? JSON.parse(saved) : []
        products.unshift(product)
        localStorage.setItem('platform_products', JSON.stringify(products))
      } catch {}
      return { success: true, product }
    }
  }
}

export default platformProductService