import React, { useEffect, useState } from 'react'
import orderService from '../services/orderService'
import useAuth from '../hooks/useAuth'
import { Link } from 'react-router-dom'

export default function MyOrders() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
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
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Orders</h2>
        <Link to="/stores" className="text-indigo-600 hover:text-indigo-800">Browse Stores</Link>
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
            return (
              <div key={order.id || order.reference || Math.random()} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">Order {order.reference || order.id || ''}</div>
                    <div className="text-sm text-gray-600">{dateStr}</div>
                  </div>
                  <div className="font-medium">{order.status || 'Pending'}</div>
                </div>
                {order.total != null && (
                  <div className="mt-2 text-gray-700">Total: ₹{Number(order.total).toFixed(2)}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}