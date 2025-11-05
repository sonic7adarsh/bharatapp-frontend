import React, { useEffect, useState } from 'react'
import { PageFade, PressScale } from '../motion/presets'
import { STORES } from '../data/stores'

export default function AdminDashboard() {
  const [pending, setPending] = useState([])
  const [vendors, setVendors] = useState([])
  const [vendorQuery, setVendorQuery] = useState('')
  const [vendorCategory, setVendorCategory] = useState('')
  const [pendingCity, setPendingCity] = useState('')
  const [selectedPending, setSelectedPending] = useState(() => new Set())
  
  const exportCSV = (filename, rows, columns) => {
    const header = columns.map(c => c.label).join(',')
    const body = rows.map(r => columns.map(c => {
      const v = c.get(r)
      const s = v === undefined || v === null ? '' : String(v)
      // Escape quotes and wrap with quotes to keep CSV safe
      return '"' + s.replace(/"/g, '""') + '"'
    }).join(',')).join('\n')
    const csv = header + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    let init = []
    try {
      const raw = localStorage.getItem('pending_stores')
      init = raw ? JSON.parse(raw) : []
    } catch {}
    if (!Array.isArray(init) || init.length === 0) {
      init = [
        { id: 'ps-101', name: 'Annapurna Grocers', owner: 'S. Rao', city: 'Delhi' },
        { id: 'ps-102', name: 'TechHub Electronics', owner: 'M. Khan', city: 'Bengaluru' },
      ]
    }
    setPending(init)
    setVendors(Array.isArray(STORES) ? STORES : [])
  }, [])

  const persistPending = (list) => {
    setPending(list)
    try { localStorage.setItem('pending_stores', JSON.stringify(list)) } catch {}
  }

  const approve = (id) => {
    persistPending(pending.filter(p => p.id !== id))
  }
  const reject = (id) => {
    persistPending(pending.filter(p => p.id !== id))
  }

  const toggleSelectPending = (id) => {
    setSelectedPending(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const bulkApprove = () => {
    if (selectedPending.size === 0) return
    const remaining = pending.filter(p => !selectedPending.has(p.id))
    persistPending(remaining)
    setSelectedPending(new Set())
  }
  const bulkReject = () => {
    if (selectedPending.size === 0) return
    const remaining = pending.filter(p => !selectedPending.has(p.id))
    persistPending(remaining)
    setSelectedPending(new Set())
  }

  const filteredPending = pending.filter(p => (
    pendingCity ? String(p.city || '').toLowerCase().includes(String(pendingCity).toLowerCase()) : true
  ))
  const filteredVendors = vendors.filter(v => {
    const q = vendorQuery.trim().toLowerCase()
    const matchesQuery = q ? (
      String(v.name || '').toLowerCase().includes(q) ||
      String(v.category || v.type || '').toLowerCase().includes(q) ||
      String(v.area || v.location || '').toLowerCase().includes(q)
    ) : true
    const matchesCat = vendorCategory ? String(v.category || v.type || '').toLowerCase().includes(vendorCategory.toLowerCase()) : true
    return matchesQuery && matchesCat
  })

  return (
    <PageFade className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold">Admin Dashboard</h2>
      <p className="text-gray-600 mt-1">Manage vendor approvals and view registered stores.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span>Pending Approvals</span>
            <div className="flex items-center gap-2">
              <input value={pendingCity} onChange={e => setPendingCity(e.target.value)} placeholder="Filter by city" className="border rounded px-2 py-1 text-sm" />
              <button onClick={bulkApprove} className="px-2 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700">Bulk Approve</button>
              <button onClick={bulkReject} className="px-2 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700">Bulk Reject</button>
              <button
                onClick={() => exportCSV('pending-approvals.csv', filteredPending, [
                  { label: 'ID', get: r => r.id },
                  { label: 'Name', get: r => r.name },
                  { label: 'Owner', get: r => r.owner },
                  { label: 'City', get: r => r.city },
                ])}
                className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
              >
                Export CSV
              </button>
            </div>
          </div>
          {pending.length === 0 ? (
            <div className="p-4 text-gray-600">No pending approvals.</div>
          ) : (
            <ul className="divide-y">
              {filteredPending.map(p => (
                <li key={p.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-gray-600">Owner: {p.owner} • City: {p.city}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center text-sm text-gray-600 mr-3">
                      <input type="checkbox" checked={selectedPending.has(p.id)} onChange={() => toggleSelectPending(p.id)} className="mr-1" /> Select
                    </label>
                    <PressScale className="inline-block">
                      <button onClick={() => approve(p.id)} className="px-3 py-1 rounded-md bg-green-600 text-white hover:bg-green-700">Approve</button>
                    </PressScale>
                    <PressScale className="inline-block">
                      <button onClick={() => reject(p.id)} className="px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700">Reject</button>
                    </PressScale>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Vendors List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span>Vendors</span>
            <div className="flex items-center gap-2">
              <input value={vendorQuery} onChange={e => setVendorQuery(e.target.value)} placeholder="Search vendors" className="border rounded px-2 py-1 text-sm" />
              <input value={vendorCategory} onChange={e => setVendorCategory(e.target.value)} placeholder="Filter by category" className="border rounded px-2 py-1 text-sm" />
              <button
                onClick={() => exportCSV('vendors.csv', filteredVendors, [
                  { label: 'ID', get: r => r.id },
                  { label: 'Store', get: r => r.name },
                  { label: 'Category', get: r => r.category || r.type },
                  { label: 'Area', get: r => r.area || r.location },
                  { label: 'Rating', get: r => r.rating },
                ])}
                className="px-2 py-1 rounded bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
              >
                Export CSV
              </button>
            </div>
          </div>
          {vendors.length === 0 ? (
            <div className="p-4 text-gray-600">No vendors registered.</div>
          ) : (
            <div className="p-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="pb-2 pr-4">Store</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Area</th>
                    <th className="pb-2 pr-4">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map(v => (
                    <tr key={v.id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{v.name}</td>
                      <td className="py-2 pr-4">{v.category || v.type}</td>
                      <td className="py-2 pr-4">{v.area || v.location}</td>
                      <td className="py-2 pr-4">{v.rating || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageFade>
  )
}