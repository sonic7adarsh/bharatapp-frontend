import React, { useEffect, useState } from 'react'
import orderService from '../services/orderService'
import useAuth from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { PageFade, PressScale } from '../motion/presets'
import useCart from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, clearCart } = useCart()
  const navigate = useNavigate()
  const { announce } = useAnnouncer()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        announce('Loading orders…', 'polite')
        const data = await orderService.getOrders({ page, pageSize })
        const raw = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : Array.isArray(data?.items) ? data.items : []
        const totalCount = typeof data?.total === 'number' ? data.total : (Array.isArray(data) ? data.length : (Array.isArray(data?.orders) ? data.orders.length : (Array.isArray(data?.items) ? data.items.length : 0)))
        setTotal(totalCount)
        const onlyOrders = raw.filter(o => String(o?.type || 'order') !== 'room_booking')
        setOrders(onlyOrders)
        setError('')
        const count = onlyOrders.length
        announce(count > 0 ? `Loaded ${count} orders.` : 'No orders yet. Browse stores to place your first order.', 'polite')
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setError(err?.response?.data?.message || 'Failed to load orders. Please try again later.')
        announce('Failed to load orders. Please try again later.', 'assertive')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user?.id, page, pageSize])

  if (authLoading || loading) {
    return (
      <PageFade className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" aria-hidden="true"></div>
          <span className="sr-only">Loading orders…</span>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 id="orders-heading" className="text-2xl font-bold">My Orders</h1>
        <PressScale className="inline-block">
          <Link to="/stores" className="inline-flex items-center px-3 py-2 rounded-md border border-brand-primary text-brand-primary hover:bg-orange-50">Browse Stores</Link>
        </PressScale>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <section className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md" aria-labelledby="empty-orders-title">
          <p id="empty-orders-title" className="font-medium">No orders yet.</p>
          <p className="text-sm mt-1">Discover nearby stores and place your first order.</p>
          <div className="mt-3">
            <Link to="/stores" className="link-brand font-medium">Browse Stores</Link>
          </div>
        </section>
      ) : (
        <>
        <ul role="list" aria-labelledby="orders-heading" className="space-y-4">
          {orders.map((order, idx) => {
            const dateStr = (() => {
              const d = order.createdAt || order.orderDate || order.date
              const dt = d ? new Date(d) : null
              return dt ? dt.toLocaleString() : 'Unknown date'
            })()
            const stages = ['placed', 'processing', 'shipped', 'delivered']
            const status = String(order.status || 'placed').toLowerCase()
            const stageIndex = Math.max(0, stages.indexOf(status))
            const isDelivered = status === 'delivered'
            const etaRange = (() => {
              if (isDelivered) return 'Delivered'
              const base = 30 + Math.max(0, 5 - Math.min(5, (order.items || []).length || 1)) * 5
              return `${base}-${base + 10}m`
            })()
            const titleId = `order-${String(order.id || order.reference || idx)}-title`
            const descId = `order-${String(order.id || order.reference || idx)}-desc`
            const handleReorder = () => {
              try { clearCart() } catch {}
              ;(order.items || []).forEach(it => {
                addItem({ id: it.id, name: it.name, price: Number(it.price) || 0 }, Number(it.quantity || 1))
              })
              navigate('/cart')
            }
            return (
              <li key={order.id || order.reference || Math.random()} className="bg-white p-4 rounded-lg shadow-sm" aria-labelledby={titleId} aria-describedby={descId}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      <Link to={`/orders/${encodeURIComponent(order.id || order.reference || '')}`} id={titleId} className="text-indigo-600 hover:text-indigo-800" aria-label={`Order ${order.reference || order.id || ''} placed on ${dateStr}`}>
                        Order {order.reference || order.id || ''}
                      </Link>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📅 {dateStr}</span>
                      {order.total != null && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">₹{Number(order.total).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[96px] ${isDelivered ? 'bg-green-100 text-green-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {String(order.status || 'pending').toUpperCase()}
                  </span>
                </div>
                {/* Tracking timeline */}
                <div className="mt-3">
                  <div className="flex items-center">
                    {stages.map((s, idx) => (
                      <div key={s} className="flex items-center flex-1">
                        <div className={`h-2 w-2 rounded-full ${idx <= stageIndex ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
                        {idx < stages.length - 1 && (
                          <div className={`h-0.5 flex-1 mx-2 ${idx < stageIndex ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-600">
                    {stages.map(s => (
                      <div key={s} className="capitalize">{s}</div>
                    ))}
                  </div>
                </div>
                {/* ETA and actions */}
                <div className="mt-4 flex items-center justify-between">
                  <div className={`text-sm ${isDelivered ? 'text-green-700' : status === 'cancelled' ? 'text-red-700' : 'text-gray-700'}`}>{isDelivered ? 'Delivered' : status === 'cancelled' ? 'Cancelled' : `ETA ~${etaRange}`}</div>
                  <div className="flex items-center gap-2">
                    <PressScale className="inline-block">
                      <Link to={`/orders/${encodeURIComponent(order.id || order.reference || '')}`} className="px-3 py-2 rounded-md border hover:bg-gray-50" aria-label={`View details for order ${order.reference || order.id || ''}`}>
                        View details
                      </Link>
                    </PressScale>
                    <PressScale className="inline-block">
                      <button onClick={handleReorder} className="px-3 py-2 rounded-md border hover:bg-gray-50" aria-label={`Reorder items from order ${order.reference || order.id || ''}`}>Reorder</button>
                    </PressScale>
                  </div>
                </div>
                {status === 'cancelled' && order.cancellationReason && (
                  <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md">
                    Cancelled: {String(order.cancellationReason)}
                  </div>
                )}
                <span id={descId} className="sr-only">Placed on {dateStr}. {order.total != null ? `Total ₹${Number(order.total).toFixed(2)}.` : ''} Status {status}. {isDelivered ? 'Delivered.' : status === 'cancelled' ? 'Cancelled.' : `Estimated arrival ${etaRange}.`}</span>
              </li>
            )
          })}
        </ul>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</div>
          <div className="flex items-center gap-2">
            <PressScale className="inline-block">
              <button
                className="px-3 py-2 rounded-md border hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >Previous</button>
            </PressScale>
            <PressScale className="inline-block">
              <button
                className="px-3 py-2 rounded-md border hover:bg-gray-50 disabled:opacity-50"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.max(1, Math.ceil(total / pageSize))}
                aria-label="Next page"
              >Next</button>
            </PressScale>
            <label className="ml-2 text-sm text-gray-600">
              <span className="sr-only">Items per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="ml-2 border rounded px-2 py-1 text-sm"
                aria-label="Items per page"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>
          </div>
        </div>
        </>
      )}
    </PageFade>
  )
}