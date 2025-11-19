import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import sellerService from '../services/sellerService'
import { PageFade, PressScale } from '../motion/presets'
import { toast } from 'react-toastify'

export default function SellerOrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const fetchOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await sellerService.getOrder(orderId)
        if (!active) return
        setOrder(data || null)
      } catch (e) {
        if (!active) return
        console.error('Failed to load seller order:', e)
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

  const dateStr = (() => {
    const d = order?.createdAt || order?.orderDate || order?.date
    const dt = d ? new Date(d) : null
    return dt ? dt.toLocaleString() : 'Unknown date'
  })()

  async function handleUpdateStatus(next, extra = {}) {
    if (!order?.id && !order?.reference) return
    try {
      const id = order.id || order.reference
      const payload = { status: next, ...extra }
      const updated = await sellerService.updateOrderStatus(id, payload)
      setOrder(prev => ({ ...prev, ...(updated || {}), status: next }))
      toast.success('Order status updated')
    } catch (e) {
      console.error('Update status failed:', e)
    }
  }

  // Countdown for seller response deadline
  const [nowTick, setNowTick] = useState(Date.now())
  useEffect(() => {
    let timer
    const statusPlaced = String(order?.status || 'placed').toLowerCase() === 'placed'
    const deadline = order?.sellerResponseDeadline ? new Date(order.sellerResponseDeadline).getTime() : null
    const accepted = order?.sellerAcceptedAt ? new Date(order.sellerAcceptedAt).getTime() : null
    if (statusPlaced && deadline && !accepted) {
      timer = setInterval(() => setNowTick(Date.now()), 1000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [order?.status, order?.sellerResponseDeadline, order?.sellerAcceptedAt])

  const remainingMs = (() => {
    try {
      const statusPlaced = String(order?.status || 'placed').toLowerCase() === 'placed'
      const deadline = order?.sellerResponseDeadline ? new Date(order.sellerResponseDeadline).getTime() : null
      const accepted = order?.sellerAcceptedAt ? new Date(order.sellerAcceptedAt).getTime() : null
      if (!statusPlaced || !deadline || accepted) return 0
      return Math.max(0, deadline - nowTick)
    } catch { return 0 }
  })()
  const remainingText = (() => {
    const s = Math.floor(remainingMs / 1000)
    const m = Math.floor(s / 60)
    const ss = s % 60
    return `${m}m ${ss}s`
  })()

  // Auto-cancel on expiry: notify backend once when timer hits zero (if still placed)
  const [autoCancelled, setAutoCancelled] = useState(false)
  useEffect(() => {
    const isPlaced = String(order?.status || 'placed').toLowerCase() === 'placed'
    if (!order || !isPlaced) return
    if (remainingMs === 0 && !autoCancelled) {
      const id = order.id || order.reference
      if (!id) return
      ;(async () => {
        try {
          const updated = await sellerService.updateOrderStatus(id, { status: 'cancelled', cancellationReason: 'auto_cancelled_no_response', cancelledAt: new Date().toISOString() })
          setOrder(prev => ({ ...prev, ...(updated || {}), status: 'cancelled' }))
        } catch (e) {
          // Silent fail; fallback logic will still reflect cancellation locally
          console.warn('Auto-cancel patch failed:', e)
        } finally {
          setAutoCancelled(true)
        }
      })()
    }
  }, [remainingMs, order?.status, order?.id, order?.reference, autoCancelled])

  const [showRefund, setShowRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  async function handleRefundSubmit() {
    if (!order?.id && !order?.reference) return
    const amountNum = Number(refundAmount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Enter a valid refund amount')
      return
    }
    try {
      setRefundLoading(true)
      const id = order.id || order.reference
      await sellerService.requestRefund(id, { amount: amountNum, reason: refundReason || 'Refund requested' })
      toast.success('Refund requested')
      setShowRefund(false)
      setRefundAmount('')
      setRefundReason('')
    } catch (e) {
      console.error('Refund request failed:', e)
    } finally {
      setRefundLoading(false)
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
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Order Details</h2>
          <div className="text-sm text-gray-600 mt-1">{dateStr}</div>
        </div>
        <PressScale className="inline-block">
          <Link to="/seller/orders" className="inline-flex items-center px-3 py-2 rounded-md border hover:bg-gray-50">Back to Orders</Link>
        </PressScale>
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
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">Order {order.reference || order.id || ''}</div>
                <div className="mt-1 inline-flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[96px] ${String(status) === 'delivered' ? 'bg-green-100 text-green-700' : String(status) === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {String(order.status || 'pending').toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-600">Ref: {order.reference || order.id || 'N/A'}</span>
                </div>
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

          {/* Buyer address (if present) */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="font-semibold mb-2">Buyer</div>
            {order?.address ? (
              <div className="text-sm text-gray-700 space-y-1">
                {order.address.name && <div className="text-gray-900">{order.address.name}</div>}
                {order.address.phone && <div>Phone: {order.address.phone}</div>}
                {order.address.line1 && <div>{order.address.line1}</div>}
                {order.address.line2 && <div>{order.address.line2}</div>}
                {(order.address.city || order.address.pincode) && (
                  <div>{[order.address.city, order.address.pincode].filter(Boolean).join(' - ')}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No address details available.</div>
            )}
          </div>

          {/* Items */}
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

          {/* Seller actions */}
          <div className="flex items-center justify-between gap-2">
            {/* Acceptance window */}
            {String(order.status || 'placed').toLowerCase() === 'placed' && (
              <div className="text-sm text-gray-700">
                Respond within <span className="font-medium">{remainingText}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {String(order.status || 'placed').toLowerCase() === 'placed' ? (
                <>
                  <PressScale className="inline-block">
                    <button
                      onClick={() => handleUpdateStatus('processing', { sellerAcceptedAt: new Date().toISOString() })}
                      disabled={remainingMs === 0}
                      className="px-3 py-2 rounded-md border hover:bg-gray-50 disabled:opacity-60"
                    >Accept</button>
                  </PressScale>
                  <PressScale className="inline-block">
                    <button
                      onClick={() => {
                        const reason = window.prompt('Reason for rejection (optional):', 'Seller rejected') || 'seller_rejected'
                        handleUpdateStatus('cancelled', { cancellationReason: reason, cancelledAt: new Date().toISOString() })
                      }}
                      className="px-3 py-2 rounded-md border hover:bg-gray-50"
                    >Reject</button>
                  </PressScale>
                </>
              ) : (
                <>
                  <PressScale className="inline-block">
                    <button onClick={() => handleUpdateStatus('processing')} className="px-3 py-2 rounded-md border hover:bg-gray-50">Mark Processing</button>
                  </PressScale>
                  <PressScale className="inline-block">
                    <button onClick={() => handleUpdateStatus('shipped')} className="px-3 py-2 rounded-md border hover:bg-gray-50">Mark Shipped</button>
                  </PressScale>
                  <PressScale className="inline-block">
                    <button onClick={() => handleUpdateStatus('delivered')} className="px-3 py-2 rounded-md border hover:bg-gray-50">Mark Delivered</button>
                  </PressScale>
                  {String(order.status).toLowerCase() !== 'cancelled' && String(order.status).toLowerCase() !== 'delivered' && (
                    <PressScale className="inline-block">
                      <button
                        onClick={() => {
                          const reason = window.prompt('Reason for cancellation (optional):', 'Seller cancelled after acceptance') || 'seller_cancelled_after_acceptance'
                          handleUpdateStatus('cancelled', { cancellationReason: reason, cancelledAt: new Date().toISOString() })
                        }}
                        className="px-3 py-2 rounded-md border hover:bg-gray-50"
                      >Cancel Order</button>
                    </PressScale>
                  )}
                </>
              )}
              <PressScale className="inline-block">
                <button onClick={() => setShowRefund(v => !v)} className="px-3 py-2 rounded-md border hover:bg-gray-50">Request Refund</button>
              </PressScale>
            </div>
          </div>

          {showRefund && (
            <div className="mt-4 bg-white p-4 rounded-lg border">
              <div className="font-semibold mb-2">Refund</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1" htmlFor="refundAmount">Amount (₹)</label>
                  <input id="refundAmount" type="number" step="0.01" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm mb-1" htmlFor="refundReason">Reason</label>
                  <input id="refundReason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Optional" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <PressScale className="inline-block">
                  <button onClick={handleRefundSubmit} disabled={refundLoading} className="px-3 py-2 rounded-md bg-indigo-600 text-white disabled:opacity-60">{refundLoading ? 'Submitting…' : 'Submit Refund'}</button>
                </PressScale>
                <PressScale className="inline-block">
                  <button onClick={() => setShowRefund(false)} className="px-3 py-2 rounded-md border">Cancel</button>
                </PressScale>
              </div>
            </div>
          )}
        </div>
      )}
    </PageFade>
  )
}