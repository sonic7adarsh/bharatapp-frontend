import React, { useMemo, useState, useEffect } from 'react'
import platformProductService from '../services/platformProductService'
import productService from '../services/productService'
import sellerService from '../services/sellerService'
import { toast } from 'react-toastify'
import { useLocation, Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function AddProduct() {
  const { isSeller, isAdmin } = useAuth()
  const location = useLocation()
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const [storeId, setStoreId] = useState(params.get('storeId') || '')
  const [stores, setStores] = useState([])
  const [storesLoading, setStoresLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    category: ''
  })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  function onChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function validate() {
    if (!form.name.trim()) {
      toast.error('Product name is required')
      return false
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error('Price must be a positive number')
      return false
    }
    if (!form.description.trim() || form.description.trim().length < 5) {
      toast.error('Description must be at least 5 characters')
      return false
    }
    if (!form.category.trim()) {
      toast.error('Category is required')
      return false
    }
    return true
  }

  function onImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview('')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error('Image size must be under 3MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    return () => {
      setImagePreview('')
      setImageFile(null)
    }
  }, [])

  useEffect(() => {
    let active = true
    setCategoriesLoading(true)
    ;(async () => {
      try {
        const list = await productService.getCategories()
        if (!active) return
        setCategories(Array.isArray(list) ? list : [])
        // If category empty and we have categories, preselect first
        if (!form.category && Array.isArray(list) && list.length > 0) {
          setForm(prev => ({ ...prev, category: String(list[0]?.name || list[0] || '') }))
        }
      } catch (err) {
        console.error('Load categories error:', err)
      } finally {
        if (active) setCategoriesLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isSeller) return
    let active = true
    setStoresLoading(true)
    ;(async () => {
      try {
        const list = await sellerService.getSellerStores()
        if (!active) return
        setStores(Array.isArray(list) ? list : [])
        // If no storeId in URL, preselect first store
        if (!storeId && Array.isArray(list) && list.length > 0) {
          const first = list[0]
          if (first?.id) setStoreId(String(first.id))
        }
      } catch (err) {
        // Error toast handled globally
        console.error('Load seller stores error:', err)
      } finally {
        if (active) setStoresLoading(false)
      }
    })()
    return () => { active = false }
  }, [isSeller])

  async function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        category: form.category.trim(),
        storeId: storeId || undefined
      }
      if (isSeller) {
        if (!storeId) {
          toast.error('Please select a store to add the product.')
          return
        }
        await sellerService.createProduct(storeId, { ...payload, imageFile })
      } else {
        // Admin or platform context
        await platformProductService.createProduct({ ...payload, imageFile })
      }
      setForm({ name: '', price: '', description: '', category: '' })
      setImageFile(null)
      setImagePreview('')
      setSubmitted(false)
      toast.success('Product added successfully.')
    } catch (err) {
      // Error toast handled globally via axios interceptor
      console.error('Add product error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      {/* Global ToastContainer is rendered in main.jsx */}
      <h2 className="text-2xl font-bold">Add New Product</h2>
      <p className="text-gray-600 mt-1">Create a product and save it to your catalog.</p>
      {storeId && (
        <p className="text-xs text-gray-500 mt-1">Linked store: {storeId}</p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-describedby="form-help">
        {isSeller && (
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="store">Select store</label>
            <div className="flex items-center gap-2">
              <select
                id="store"
                name="store"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="w-full border rounded px-3 py-2"
                aria-busy={storesLoading}
              >
                <option value="">{storesLoading ? 'Loading stores…' : 'Choose a store'}</option>
                {stores.map(s => (
                  <option key={s.id || s._id || s.slug || s.name} value={String(s.id || s._id || '')}>
                    {s.name || s.title || s.slug || String(s.id || s._id || '')}
                  </option>
                ))}
              </select>
              <Link to="/onboard" className="text-indigo-600 text-sm whitespace-nowrap">Create store</Link>
            </div>
            {!storeId && (
              <p className="text-xs text-gray-500 mt-1">Pick your store to add the product.</p>
            )}
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="image">Product image (optional)</label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="w-full"
            aria-describedby="image-help"
          />
          {imagePreview && (
            <div className="mt-2">
              <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded border" />
            </div>
          )}
          <p id="image-help" className="text-xs text-gray-500 mt-1">Supported formats: JPG/PNG, max size 3MB.</p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., Fresh Apples"
            required
            aria-invalid={!form.name.trim() && submitted}
            aria-describedby="name-help"
          />
          {!form.name.trim() && submitted && (
            <p id="name-help" className="text-xs text-red-600 mt-1">Product name is required.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="price">Price (₹)</label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={form.price}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g., 99.00"
            required
            aria-invalid={(!(form.price && !isNaN(Number(form.price)) && Number(form.price) > 0)) && submitted}
            aria-describedby="price-help"
          />
          {(!(form.price && !isNaN(Number(form.price)) && Number(form.price) > 0)) && submitted && (
            <p id="price-help" className="text-xs text-red-600 mt-1">Enter a positive price.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            rows={4}
            placeholder="Brief details about the product"
            required
            aria-invalid={(form.description.trim().length < 5) && submitted}
            aria-describedby="description-help"
          />
          {(form.description.trim().length < 5) && submitted && (
            <p id="description-help" className="text-xs text-red-600 mt-1">Description must be at least 5 characters.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={onChange}
            className="w-full border rounded px-3 py-2"
            aria-busy={categoriesLoading}
            required
            aria-invalid={!String(form.category || '').trim() && submitted}
            aria-describedby="category-help"
          >
            <option value="">{categoriesLoading ? 'Loading categories…' : 'Select a category'}</option>
            {categories.map((c, idx) => {
              const value = typeof c === 'string' ? c : (c?.name || c?.title || c?.slug || '')
              const label = typeof c === 'string' ? c : (c?.title || c?.name || c?.slug || value)
              return (
                <option key={value || idx} value={String(value)}>{label}</option>
              )
            })}
          </select>
          {!String(form.category || '').trim() && submitted && (
            <p id="category-help" className="text-xs text-red-600 mt-1">Category is required.</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-60"
            aria-busy={loading}
          >
            {loading ? 'Saving...' : 'Add Product'}
          </button>
        </div>
      </form>
    </main>
  )
}