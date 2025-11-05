import React, { useEffect, useState } from 'react'
import orderService from '../services/orderService'
import useAuth from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { PageFade, PressScale } from '../motion/presets'
import useCart from '../context/CartContext'
import { useNavigate } from 'react-router-dom'

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, clearCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const data = await orderService.getOrders()
        setOrders(Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : [])
        setError('')
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setError(err?.response?.data?.message || 'Failed to load orders. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [user?.id])

  if (authLoading || loading) {
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
        <h2 className="text-2xl font-bold">My Orders</h2>
        <PressScale className="inline-block">
          <Link to="/stores" className="text-indigo-600 hover:text-indigo-800">Browse Stores</Link>
        </PressScale>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
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
            const handleReorder = () => {
              try { clearCart() } catch {}
              ;(order.items || []).forEach(it => {
                addItem({ id: it.id, name: it.name, price: Number(it.price) || 0 }, Number(it.quantity || 1))
              })
              navigate('/cart')
            }
            return (
              <div key={order.id || order.reference || Math.random()} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">
                      <Link to={`/orders/${encodeURIComponent(order.id || order.reference || '')}`} className="text-indigo-600 hover:text-indigo-800">
                        Order {order.reference || order.id || ''}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-600">{dateStr}</div>
                  </div>
                  <div className="font-medium">{order.status || 'Pending'}</div>
                </div>
                {order.total != null && (
                  <div className="mt-2 text-gray-700">Total: ₹{Number(order.total).toFixed(2)}</div>
                )}
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
                  <div className={`text-sm ${isDelivered ? 'text-green-700' : 'text-gray-700'}`}>{isDelivered ? 'Delivered' : `ETA ~${etaRange}`}</div>
                  <div className="flex items-center gap-2">
                    <PressScale className="inline-block">
                      <Link to={`/orders/${encodeURIComponent(order.id || order.reference || '')}`} className="px-3 py-2 rounded-md border hover:bg-gray-50">View details</Link>
                    </PressScale>
                    <PressScale className="inline-block">
                      <button onClick={handleReorder} className="px-3 py-2 rounded-md border hover:bg-gray-50">Reorder</button>
                    </PressScale>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageFade>
  )
}