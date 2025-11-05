import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import useCart from '../context/CartContext'
import { PageFade, PressScale } from '../motion/presets'
import { toast } from 'react-toastify'

export default function OrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem, clearCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await orderService.getOrders()
        const orders = Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []
        let found = null
        if (orderId === 'latest' && orders.length > 0) {
          found = orders[0]
        } else {
          found = orders.find(o => String(o.id || '').toLowerCase() === String(orderId).toLowerCase())
          if (!found) {
            found = orders.find(o => String(o.reference || '').toLowerCase() === String(orderId).toLowerCase())
          }
        }
        if (!active) return
        if (found) setOrder(found)
        else setError('Order not found')
      } catch (e) {
        if (!active) return
        console.error('Failed to load order:', e)
        setError('Failed to load order. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchOrder()
    return () => { active = false }
  }, [orderId])

  const stages = useMemo(() => ['placed', 'processing', 'shipped', 'delivered'], [])
  const status = String(order?.status || 'placed').toLowerCase()
  const stageIndex = Math.max(0, stages.indexOf(status))
  const isDelivered = status === 'delivered'

  const dateStr = (() => {
    const d = order?.createdAt || order?.orderDate || order?.date
    const dt = d ? new Date(d) : null
    return dt ? dt.toLocaleString() : 'Unknown date'
  })()

  const handleReorder = () => {
    if (!order) return
    try { clearCart() } catch {}
    ;(order.items || []).forEach(it => {
      addItem({ id: it.id, name: it.name, price: Number(it.price) || 0 }, Number(it.quantity || 1))
    })
    navigate('/cart')
  }

  const handleCopyReference = async () => {
    const ref = order?.reference || order?.id || ''
    if (!ref) return
    try {
      await navigator.clipboard.writeText(String(ref))
      toast.success('Order reference copied')
    } catch (e) {
      toast.info('Copy failed. Please copy manually.')
    }
  }

  if (loading) {
    return (
      <PageFade className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Order Details</h2>
          <div className="text-sm text-gray-600 mt-1">{dateStr}</div>
        </div>
        <div className="flex items-center gap-3">
          <PressScale className="inline-block">
            <button onClick={handleCopyReference} className="text-indigo-600 hover:text-indigo-800">Copy reference</button>
          </PressScale>
          <PressScale className="inline-block">
            <Link to="/orders" className="text-indigo-600 hover:text-indigo-800">Back to Orders</Link>
          </PressScale>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {!order ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Unable to display order.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">Order {order.reference || order.id || ''}</div>
                <div className="text-sm text-gray-600">Status: {order.status || 'Pending'}</div>
              </div>
              {order.total != null && (
                <div className="font-medium">Total: ₹{Number(order.total).toFixed(2)}</div>
              )}
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
          </div>

          {/* Delivery details */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-semibold mb-2">Delivery</div>
            {order?.address ? (
              <div className="text-sm text-gray-700 space-y-1">
                {order.address.name && <div className="text-gray-900">{order.address.name}</div>}
                {order.address.phone && <div>Phone: {order.address.phone}</div>}
                {order.address.line1 && <div>{order.address.line1}</div>}
                {order.address.line2 && <div>{order.address.line2}</div>}
                {(order.address.city || order.address.pincode) && (
                  <div>{[order.address.city, order.address.pincode].filter(Boolean).join(' - ')}</div>
                )}
                {order.deliverySlot && <div>Slot: {order.deliverySlot}</div>}
                {order.deliveryInstructions && <div>Instructions: {order.deliveryInstructions}</div>}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No address details available.</div>
            )}
          </div>

          {/* Payment info */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-semibold mb-2">Payment</div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Method: {(order?.paymentMethod || 'cod').toUpperCase()}</div>
              {order?.paymentInfo && (
                <div>
                  <div>Gateway: {order.paymentInfo.gateway || 'N/A'}</div>
                  {order.paymentInfo.reference && <div>Reference: {order.paymentInfo.reference}</div>}
                  {order.paymentInfo.status && <div>Status: {order.paymentInfo.status}</div>}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-semibold mb-2">Items</div>
            <div className="divide-y">
              {(order.items || []).map(it => (
                <div key={it.id} className="py-2 flex justify-between">
                  <div>
                    <div className="font-medium">{it.name}</div>
                    <div className="text-sm text-gray-600">Qty: {it.quantity || 1}</div>
                  </div>
                  <div className="text-gray-800">₹{Number(it.price).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDelivered ? 'text-green-700' : 'text-gray-700'}`}>{isDelivered ? 'Delivered' : 'In transit'}</div>
            <PressScale className="inline-block">
              <button onClick={handleReorder} className="px-3 py-2 rounded-md border hover:bg-gray-50">Reorder</button>
            </PressScale>
          </div>
        </div>
      )}
    </PageFade>
  )
}