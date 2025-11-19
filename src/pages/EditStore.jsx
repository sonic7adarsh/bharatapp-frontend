import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import sellerService from '../services/sellerService'
import storeService from '../services/storeService'
import { PageFade, PressScale } from '../motion/presets'

export default function EditStore() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [store, setStore] = useState(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    address: '',
    area: '',
    city: '',
    status: 'open',
    orderingDisabled: false,
    closedReason: '',
    closedUntil: '',
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const s = await sellerService.getSellerStore(storeId)
        const data = s || await storeService.getStore(storeId)
        if (!active) return
        setStore(data)
        setForm(prev => ({
          ...prev,
          name: data?.name || '',
          description: data?.description || '',
          category: data?.category || data?.type || '',
          address: data?.address || '',
          area: data?.area || '',
          city: data?.city || '',
          status: String(data?.status || 'open').toLowerCase(),
          orderingDisabled: Boolean(data?.orderingDisabled),
          closedReason: data?.closedReason || '',
          closedUntil: data?.closedUntil || '',
        }))
      } catch (e) {
        console.error('Failed to load store:', e)
        if (!active) return
        setError('Failed to load store. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [storeId])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      address: form.address,
      area: form.area,
      city: form.city,
      status: form.status,
      orderingDisabled: form.orderingDisabled,
      closedReason: form.closedReason || null,
      closedUntil: form.closedUntil || null,
    }
    try {
      await sellerService.updateStore(storeId, payload)
      navigate('/dashboard')
    } catch (e) {
      console.error('Update store failed:', e)
      setError(e?.response?.data?.message || 'Failed to update store. Please try again later.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageFade className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link to="/dashboard" className="text-sm link-brand">&larr; Back to Dashboard</Link>
      </div>
      <h1 className="text-2xl font-bold">Edit Store</h1>
      {loading ? (
        <div className="mt-6 text-gray-600">Loading store details…</div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input id="name" name="name" value={form.name} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" required />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" rows={3} />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium">Category</label>
            <input id="category" name="category" value={form.category} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium">Address</label>
              <input id="address" name="address" value={form.address} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label htmlFor="area" className="block text-sm font-medium">Area</label>
              <input id="area" name="area" value={form.area} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium">City</label>
              <input id="city" name="city" value={form.city} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium">Status</label>
              <select id="status" name="status" value={form.status} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full">
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input id="orderingDisabled" name="orderingDisabled" type="checkbox" checked={form.orderingDisabled} onChange={onChange} />
            <label htmlFor="orderingDisabled" className="text-sm">Disable ordering</label>
          </div>
          {form.status === 'closed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="closedReason" className="block text-sm font-medium">Closed Reason</label>
                <input id="closedReason" name="closedReason" value={form.closedReason} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label htmlFor="closedUntil" className="block text-sm font-medium">Closed Until (ISO date-time)</label>
                <input id="closedUntil" name="closedUntil" value={form.closedUntil} onChange={onChange} className="mt-1 border rounded px-3 py-2 w-full" placeholder="2025-01-31T18:00:00Z" />
              </div>
            </div>
          )}
          <div className="pt-2">
            <PressScale className="inline-block">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </PressScale>
          </div>
        </form>
      )}
    </PageFade>
  )
}