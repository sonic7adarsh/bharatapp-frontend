import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import sellerService from '../services/sellerService'
import { PageFade, PressScale } from '../motion/presets'
import DateRangePicker from '../components/DateRangePicker'

export default function SellerOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Filters must be declared before useEffect to avoid TDZ errors
  const [statusFilter, setStatusFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const params = {
          limit: 100,
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined
        }
        const data = await sellerService.getOrders(params)
        if (!active) return
        setOrders(Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : [])
      } catch (e) {
        if (!active) return
        console.error('Failed to load seller orders:', e)
        setError('Failed to load orders. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [statusFilter, fromDate, toDate])

  const filtered = useMemo(() => orders, [orders])

  const total = useMemo(() => filtered.length, [filtered])

  if (loading) {
    return (
      <PageFade className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Seller Orders</h2>
          <div className="text-sm text-gray-600 mt-1">Total: {total}</div>
        </div>
        <PressScale className="inline-block">
          <Link to="/dashboard" className="px-3 py-2 rounded-md border hover:bg-gray-50">Back to Dashboard</Link>
        </PressScale>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          No orders found.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Filters */}
          <div className="p-3 border-b flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs text-gray-600">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="ml-2 border rounded px-2 py-1 text-sm">
                <option value="">All</option>
                <option value="placed">Placed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <DateRangePicker
              from={fromDate}
              to={toDate}
              onChange={({ from, to }) => { setFromDate(from || ''); setToDate(to || ''); }}
              className="min-w-[260px]"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Reference</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(o => {
                  const date = o.createdAt || o.orderDate || o.date
                  const dt = date ? new Date(date) : null
                  return (
                    <tr key={o.id || o.reference}>
                      <td className="px-4 py-2 text-sm">{o.reference || o.id}</td>
                      <td className="px-4 py-2 text-sm capitalize">{String(o.status || 'pending')}</td>
                      <td className="px-4 py-2 text-sm">{o.total != null ? `₹${Number(o.total).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2 text-sm">{dt ? dt.toLocaleString() : 'Unknown'}</td>
                      <td className="px-4 py-2 text-right">
                        <PressScale className="inline-block">
                          <Link to={`/seller/orders/${o.id || o.reference}`} className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50">View</Link>
                        </PressScale>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PageFade>
  )
}