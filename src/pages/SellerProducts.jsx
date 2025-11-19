import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import sellerService from '../services/sellerService'
import productService from '../services/productService'
import { PageFade, PressScale } from '../motion/presets'
import { useI18n } from '../context/I18nContext'

export default function SellerProducts() {
  const { t } = useI18n() || { t: (k, f) => f }
  const [stores, setStores] = useState([])
  const [storeId, setStoreId] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState({ name: '', category: '', price: '' })
  const [categories, setCategories] = useState([])
  const [catLoading, setCatLoading] = useState(false)

  // Bulk upload state
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkMode, setBulkMode] = useState('upsert')
  const [bulkDryRun, setBulkDryRun] = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState('INR')
  const [defaultTaxRate, setDefaultTaxRate] = useState('')
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkJob, setBulkJob] = useState(null)
  const [bulkStatus, setBulkStatus] = useState(null)
  const [bulkErrors, setBulkErrors] = useState([])
  const [bulkErrorMsg, setBulkErrorMsg] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await sellerService.getSellerStores()
        if (!active) return
        setStores(Array.isArray(data) ? data : [])
        if (!storeId && Array.isArray(data) && data.length > 0) {
          const first = data[0]
          if (first?.id) setStoreId(String(first.id))
        }
      } catch (e) {
        console.error('Failed to load stores:', e)
      }
    })()
    return () => { active = false }
  }, [])

  // Load categories for edit dropdown
  useEffect(() => {
    let active = true
    setCatLoading(true)
    ;(async () => {
      try {
        const list = await productService.getCategories()
        if (!active) return
        setCategories(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('Failed to load categories:', e)
      } finally {
        if (active) setCatLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!storeId) return
    let active = true
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const list = await sellerService.getStoreProducts(storeId)
        if (!active) return
        setProducts(Array.isArray(list) ? list : [])
      } catch (e) {
        if (!active) return
        console.error('Failed to load products:', e)
        setError('Failed to load products. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [storeId])

  const onDelete = async (id) => {
    if (!id) return
    const ok = window.confirm('Delete this product?')
    if (!ok) return
    try {
      await sellerService.deleteProduct(id)
      setProducts(prev => prev.filter(p => (p.id || p._id) !== id))
    } catch (e) {
      console.error('Delete product error:', e)
    }
  }

  const onSave = async (id, patch) => {
    if (!id) return
    try {
      const updated = await sellerService.updateProduct(id, patch)
      setProducts(prev => prev.map(p => ((p.id || p._id) === id ? { ...p, ...updated } : p)))
      setEditingId('')
    } catch (e) {
      console.error('Update product error:', e)
    }
  }

  const startEdit = (p) => {
    const pid = p.id || p._id
    setEditingId(String(pid))
    setDraft({ name: p.name || '', category: p.category || '', price: String(p.price ?? '') })
  }
  const cancelEdit = () => {
    setEditingId('')
    setDraft({ name: '', category: '', price: '' })
  }

  const totalProducts = useMemo(() => products.length, [products])

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Manage Products</h2>
          <div className="text-sm text-gray-600 mt-1">Total: {totalProducts}</div>
        </div>
        <PressScale className="inline-block">
          <Link to="/dashboard" className="btn-primary text-sm">{t('nav.back_to_dashboard', 'Back to Dashboard')}</Link>
        </PressScale>
      </div>

      {/* Store selector */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1 block">Select store</label>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">Choose a store</option>
          {stores.map(s => (
            <option key={s.id || s._id || s.slug || s.name} value={String(s.id || s._id || '')}>
              {s.name || s.title || s.slug || String(s.id || s._id || '')}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk CSV upload */}
      <div className="mb-6 border rounded-lg p-4 bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">Bulk upload products (CSV)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">CSV file</label>
            <input type="file" accept=".csv,text/csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 bg-white" />
            <p className="text-xs text-gray-600 mt-1">Required columns: name, sku, price, stockQuantity</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Mode</label>
            <select value={bulkMode} onChange={(e) => setBulkMode(e.target.value)} className="w-full border rounded px-3 py-2 bg-white">
              <option value="upsert">Upsert (default)</option>
              <option value="create">Create only</option>
              <option value="update">Update only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input id="bulk-dryrun" type="checkbox" checked={bulkDryRun} onChange={(e) => setBulkDryRun(e.target.checked)} />
            <label htmlFor="bulk-dryrun" className="text-sm">Dry run (validate only)</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Default currency</label>
              <input value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Default tax rate (%)</label>
              <input type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} className="w-full border rounded px-3 py-2 bg-white" />
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <PressScale className="inline-block">
            <button
              disabled={!bulkFile || bulkUploading}
              onClick={async () => {
                if (!bulkFile) return
                setBulkUploading(true)
                setBulkErrorMsg('')
                setBulkErrors([])
                setBulkJob(null)
                setBulkStatus(null)
                try {
                  // Prefer backend-driven S3 presign upload flow
                  let key = ''
                  try {
                    const presign = await sellerService.presignBulkProductCsv({ fileName: bulkFile.name, contentType: 'text/csv', folder: 'bulk-products' })
                    key = presign?.key || ''
                    const headers = presign?.headers || { 'Content-Type': 'text/csv' }
                    const method = presign?.method || 'PUT'
                    const res = await fetch(presign?.uploadUrl, { method, headers, body: bulkFile })
                    if (!res.ok) throw new Error('S3 upload failed')
                  } catch (e) {
                    // Fallback to direct multipart upload if presign fails
                    const resp = await sellerService.bulkUploadProducts(bulkFile, {
                      mode: bulkMode,
                      dryRun: bulkDryRun,
                      defaultCurrency: defaultCurrency || undefined,
                      defaultTaxRate: defaultTaxRate !== '' ? Number(defaultTaxRate) : undefined
                    })
                    if (resp?.dryRun) {
                      setBulkStatus({ status: 'dryRun', stats: { total: resp.totalRows, valid: resp.validRows, invalid: resp.invalidRows } })
                      setBulkErrors(Array.isArray(resp?.errors) ? resp.errors : [])
                    } else if (resp?.jobId) {
                      setBulkJob(resp)
                      let cancelled = false
                      const poll = async () => {
                        try {
                          const s = await sellerService.getBulkUploadStatus(resp.jobId)
                          setBulkStatus(s)
                          if (s?.status === 'completed' || s?.status === 'failed') return
                          if (!cancelled) setTimeout(poll, 2000)
                        } catch (err) {
                          if (!cancelled) setTimeout(poll, 3000)
                        }
                      }
                      poll()
                    }
                    return
                  }

                  // Submit job by S3 key
                  const resp = await sellerService.bulkUploadProductsByKey(key, {
                    mode: bulkMode,
                    dryRun: bulkDryRun,
                    defaultCurrency: defaultCurrency || undefined,
                    defaultTaxRate: defaultTaxRate !== '' ? Number(defaultTaxRate) : undefined
                  })
                  if (resp?.dryRun) {
                    setBulkStatus({ status: 'dryRun', stats: { total: resp.totalRows, valid: resp.validRows, invalid: resp.invalidRows } })
                    setBulkErrors(Array.isArray(resp?.errors) ? resp.errors : [])
                  } else if (resp?.jobId) {
                    setBulkJob(resp)
                    let cancelled = false
                    const poll = async () => {
                      try {
                        const s = await sellerService.getBulkUploadStatus(resp.jobId)
                        setBulkStatus(s)
                        if (s?.status === 'completed' || s?.status === 'failed') return
                        if (!cancelled) setTimeout(poll, 2000)
                      } catch (err) {
                        if (!cancelled) setTimeout(poll, 3000)
                      }
                    }
                    poll()
                  }
                } catch (e) {
                  console.error('Bulk upload error:', e)
                  setBulkErrorMsg('Bulk upload failed. Please check your CSV and try again.')
                } finally {
                  setBulkUploading(false)
                }
              }}
              className={`px-3 py-2 rounded-md text-sm ${bulkUploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
            >
              {bulkUploading ? 'Uploading…' : bulkDryRun ? 'Validate CSV' : 'Upload CSV'}
            </button>
          </PressScale>
          <a href="/api/seller/products/bulk-upload/template" className="text-sm underline" target="_blank" rel="noreferrer">Download template CSV</a>
          {bulkErrorMsg && <span className="text-sm text-red-600">{bulkErrorMsg}</span>}
        </div>

        {bulkStatus && (
          <div className="mt-4 bg-white border rounded p-3">
            <div className="text-sm text-gray-700">Status: {bulkStatus.status || 'n/a'}</div>
            {bulkStatus?.stats && (
              <div className="text-sm text-gray-700 mt-2">
                <div>Total: {bulkStatus.stats.total}</div>
                {typeof bulkStatus.stats.created === 'number' && <div>Created: {bulkStatus.stats.created}</div>}
                {typeof bulkStatus.stats.updated === 'number' && <div>Updated: {bulkStatus.stats.updated}</div>}
                {typeof bulkStatus.stats.unchanged === 'number' && <div>Unchanged: {bulkStatus.stats.unchanged}</div>}
                {typeof bulkStatus.stats.invalid === 'number' && <div>Invalid: {bulkStatus.stats.invalid}</div>}
              </div>
            )}
            <div className="mt-2">
              <PressScale className="inline-block">
                <button
                  disabled={!bulkJob?.jobId}
                  onClick={async () => {
                    if (!bulkJob?.jobId) return
                    const errs = await sellerService.getBulkUploadErrors(bulkJob.jobId)
                    setBulkErrors(errs)
                  }}
                  className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
                >
                  Fetch error report
                </button>
              </PressScale>
            </div>
            {bulkErrors?.length > 0 && (
              <div className="mt-3">
                <div className="text-sm font-medium mb-2">Errors ({bulkErrors.length})</div>
                <div className="max-h-60 overflow-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="px-2 py-1 text-left">Row</th>
                        <th className="px-2 py-1 text-left">Column</th>
                        <th className="px-2 py-1 text-left">Code</th>
                        <th className="px-2 py-1 text-left">Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkErrors.map((e, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-2 py-1">{e.row}</td>
                          <td className="px-2 py-1">{e.column || '-'}</td>
                          <td className="px-2 py-1">{e.code}</td>
                          <td className="px-2 py-1">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          No products found. <Link to={`/products/add?storeId=${encodeURIComponent(storeId || '')}`} className="underline">Add one</Link>.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(p => {
                const pid = p.id || p._id
                const isEditing = editingId === String(pid)
                return (
                  <tr key={pid}>
                    <td className="px-4 py-2 text-sm align-middle">
                      {isEditing ? (
                        <input value={draft.name} onChange={(e) => setDraft(d => ({ ...d, name: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        <span className="block px-2 py-1">{p.name}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm align-middle">
                      {isEditing ? (
                        <select value={draft.category} onChange={(e) => setDraft(d => ({ ...d, category: e.target.value }))} className="border rounded px-2 py-2 w-full">
                          <option value="">{catLoading ? 'Loading…' : 'Select category'}</option>
                          {categories.map(c => (<option key={c} value={c}>{c}</option>))}
                        </select>
                      ) : (
                        <span className="block px-2 py-1">{p.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm align-middle">
                      {isEditing ? (
                        <input type="number" value={draft.price} onChange={(e) => setDraft(d => ({ ...d, price: e.target.value }))} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        <span className="block px-2 py-1">{p.price}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {!isEditing ? (
                          <>
                            <PressScale className="inline-block">
                              <Link to={`/products/add?storeId=${encodeURIComponent(storeId)}&clone=${encodeURIComponent(pid)}`} className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50">Clone</Link>
                            </PressScale>
                            <PressScale className="inline-block">
                              <button onClick={() => startEdit(p)} className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50">Edit</button>
                            </PressScale>
                            <PressScale className="inline-block">
                              <button onClick={() => onDelete(pid)} className="px-2 py-1 rounded-md border text-sm hover:bg-red-50 text-red-600 border-red-200">Delete</button>
                            </PressScale>
                          </>
                        ) : (
                          <>
                            <PressScale className="inline-block">
                              <button onClick={() => onSave(pid, { name: draft.name, category: draft.category, price: Number(draft.price) })} className="px-2 py-1 rounded-md border text-sm bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
                            </PressScale>
                            <PressScale className="inline-block">
                              <button onClick={cancelEdit} className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50">Cancel</button>
                            </PressScale>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFade>
  )
}