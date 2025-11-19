import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import sellerService from '../services/sellerService'
import { PageFade, PressScale } from '../motion/presets'
import { useI18n } from '../context/I18nContext'
import DateRangePicker from '../components/DateRangePicker'

export default function SellerOrders() {
  const { t } = useI18n() || { t: (k, f) => f }
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
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
          page,
          pageSize,
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined
        }
        const data = await sellerService.getOrders(params)
        if (!active) return
        const list = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.items) ? data.items : []
        setOrders(list)
        const totalCount = typeof data?.total === 'number' ? data.total : (Array.isArray(data) ? data.length : (Array.isArray(data?.orders) ? data.orders.length : (Array.isArray(data?.items) ? data.items.length : 0)))
        setTotal(totalCount)
      } catch (e) {
        if (!active) return
        console.error('Failed to load seller orders:', e)
        setError('Failed to load orders. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [statusFilter, fromDate, toDate, page, pageSize])

  const filtered = useMemo(() => orders, [orders])

  async function updateStatus(orderId, payload) {
    try {
      const updated = await sellerService.updateOrderStatus(orderId, payload)
      setOrders(prev => prev.map(o => (o.id === orderId || o.reference === orderId) ? { ...o, ...(updated || {}), status: payload.status } : o))
    } catch (e) {
      console.error('Failed to update order status:', e)
    }
  }

  // Force re-render to update countdowns
  const [tick, setTick] = useState(Date.now())
  useEffect(() => {
    const hasAwaiting = filtered.some(o => String(o.status || 'placed').toLowerCase() === 'placed' && o.sellerResponseDeadline && !o.sellerAcceptedAt)
    if (!hasAwaiting) return
    const t = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [filtered])

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
          <Link to="/dashboard" className="btn-primary text-sm">{t('nav.back_to_dashboard', 'Back to Dashboard')}</Link>
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
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-600">Items per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="border rounded px-2 py-1 text-sm"
                aria-label="Items per page"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
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
                  const remainingMs = (() => {
                    try {
                      const statusPlaced = String(o?.status || 'placed').toLowerCase() === 'placed'
                      const deadline = o?.sellerResponseDeadline ? new Date(o.sellerResponseDeadline).getTime() : null
                      const accepted = o?.sellerAcceptedAt ? new Date(o.sellerAcceptedAt).getTime() : null
                      if (!statusPlaced || !deadline || accepted) return 0
                      return Math.max(0, deadline - tick)
                    } catch { return 0 }
                  })()
                  const remainingText = (() => {
                    const s = Math.floor(remainingMs / 1000)
                    const m = Math.floor(s / 60)
                    const ss = s % 60
                    return `${m}m ${ss}s`
                  })()
                  return (
                    <tr key={o.id || o.reference}>
                      <td className="px-4 py-2 text-sm">{o.reference || o.id}</td>
                      <td className="px-4 py-2 text-sm capitalize">{String(o.status || 'pending')}</td>
                      <td className="px-4 py-2 text-sm">{o.total != null ? `₹${Number(o.total).toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-2 text-sm">{dt ? dt.toLocaleString() : 'Unknown'}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          {String(o.status || 'placed').toLowerCase() === 'placed' ? (
                            <>
                              <span className="text-xs text-gray-600">{remainingMs > 0 ? `Respond in ${remainingText}` : 'Expired'}</span>
                              <PressScale className="inline-block">
                                <button
                                  onClick={() => updateStatus(o.id || o.reference, { status: 'processing', sellerAcceptedAt: new Date().toISOString() })}
                                  disabled={remainingMs === 0}
                                  className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-60"
                                >Accept</button>
                              </PressScale>
                              <PressScale className="inline-block">
                                <button
                                  onClick={() => {
                                    const reason = window.prompt('Reason for rejection (optional):', 'Seller rejected') || 'seller_rejected'
                                    updateStatus(o.id || o.reference, { status: 'cancelled', cancellationReason: reason, cancelledAt: new Date().toISOString() })
                                  }}
                                  className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50"
                                >Reject</button>
                              </PressScale>
                          </>
                          ) : (
                            <>
                              <PressScale className="inline-block">
                                <Link to={`/seller/orders/${o.id || o.reference}`} className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50">View</Link>
                              </PressScale>
                              {(() => {
                                const s = String(o.status || '').toLowerCase()
                                const isFinal = s === 'delivered' || s === 'cancelled'
                                const isPlaced = s === 'placed'
                                return !isFinal && !isPlaced
                              })() && (
                                <PressScale className="inline-block">
                                  <button
                                    onClick={() => {
                                      const reason = window.prompt('Reason for cancellation (optional):', 'Seller cancelled after acceptance') || 'seller_cancelled_after_acceptance'
                                      updateStatus(o.id || o.reference, { status: 'cancelled', cancellationReason: reason, cancelledAt: new Date().toISOString() })
                                    }}
                                    className="px-2 py-1 rounded-md border text-sm hover:bg-gray-50"
                                  >Cancel</button>
                                </PressScale>
                              )}
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
          <div className="p-3 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
            <div className="flex items-center gap-2">
              <PressScale className="inline-block">
                <button
                  className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >Previous</button>
              </PressScale>
              <PressScale className="inline-block">
                <button
                  className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                >Next</button>
              </PressScale>
            </div>
          </div>
        </div>
      )}
    </PageFade>
  )
}