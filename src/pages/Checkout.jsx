import React, { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import orderService from '../services/orderService'
import useCart from '../context/CartContext'
import paymentService from '../services/paymentService'
import { toast } from 'react-toastify'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const location = useLocation()
  const method = useMemo(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('method')) return params.get('method')
    try {
      return localStorage.getItem('checkout_method') || 'cod'
    } catch {
      return 'cod'
    }
  }, [location.search])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null)
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState(0)
  const [deliverySlot, setDeliverySlot] = useState('')
  const deliveryFee = 29

  const computePayable = () => {
    const subtotal = totalPrice
    const d = Math.min(discount, subtotal)
    return Math.max(subtotal - d + deliveryFee, 0)
  }

  const isValidPhone = (p) => /^[6-9]\d{9}$/.test(String(p || '').trim())
  const isValidPincode = (pc) => /^\d{6}$/.test(String(pc || '').trim())
  const isAddressValid = () => (
    !!address.name && isValidPhone(address.phone) && !!address.line1 && !!address.city && isValidPincode(address.pincode) && !!deliverySlot
  )

  const applyPromo = () => {
    const code = promo.trim().toUpperCase()
    if (!code) return
    if (code === 'WELCOME50') {
      setDiscount(50)
      setError('')
    } else if (code === 'SAVE10') {
      const d = Math.min(Math.round(totalPrice * 0.1), 100)
      setDiscount(d)
      setError('')
    } else {
      setDiscount(0)
      setError('Invalid promo code')
    }
  }

  const placeOrder = async () => {
    if (items.length === 0) return
    if (!isAddressValid()) {
      setError('Please fill a valid address, phone, pincode, and select a delivery slot.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        totals: { subtotal: totalPrice, discount, deliveryFee, payable: computePayable() },
        address,
        deliverySlot,
        promo,
        paymentMethod: method || 'cod',
      }
      const data = await orderService.checkout(payload)
      setOrderInfo(data || { reference: 'ORDER-' + Date.now() })
      setSuccess(true)
      clearCart()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to place order. Please try again.'
      setError(message)
      console.error('Order placement error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const payOnline = async () => {
    if (items.length === 0) return
    if (!isAddressValid()) {
      setError('Please fill a valid address, phone, pincode, and select a delivery slot before payment.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const ok = await loadRazorpay()
      const key = import.meta.env.VITE_RAZORPAY_KEY_ID || ''
      const amountPaise = Math.round(Number(computePayable()) * 100)

      let order = null
      try {
        order = await paymentService.createOrder({ amount: amountPaise, currency: 'INR' })
      } catch (e) {
        order = null
      }

      if (!ok || !key || !order?.id) {
        toast.info('Proceeding with mock payment (no gateway configured)')
        const payload = {
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totals: { subtotal: totalPrice, discount, deliveryFee, payable: computePayable() },
          address,
          deliverySlot,
          promo,
          paymentMethod: 'online',
          paymentInfo: { gateway: 'mock', status: 'success', reference: 'PAY-' + Date.now() }
        }
        const data = await orderService.checkout(payload)
        setOrderInfo(data || { reference: 'ORDER-' + Date.now() })
        setSuccess(true)
        clearCart()
        return
      }

      const options = {
        key,
        amount: amountPaise,
        currency: 'INR',
        name: 'BharatApp',
        description: 'Order Payment',
        order_id: order.id,
        prefill: {
          name: address.name,
          email: '',
          contact: address.phone,
        },
        notes: { city: address.city, pincode: address.pincode },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              orderId: order.id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })

            const payload = {
              items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
              totals: { subtotal: totalPrice, discount, deliveryFee, payable: computePayable() },
              address,
              deliverySlot,
              promo,
              paymentMethod: 'online',
              paymentInfo: {
                gateway: 'razorpay',
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
              }
            }
            const data = await orderService.checkout(payload)
            setOrderInfo(data || { reference: 'ORDER-' + Date.now() })
            setSuccess(true)
            clearCart()
          } catch (err) {
            const message = err?.response?.data?.message || 'Payment verification failed. Try again.'
            setError(message)
          }
        },
        theme: { color: '#4F46E5' },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to start payment. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <h2 className="text-2xl font-bold">Order Confirmed</h2>
          <p className="mt-2">Thank you! Your order has been placed successfully.</p>
          {orderInfo?.reference && (
            <p className="mt-1 text-sm">Reference: <span className="font-medium">{orderInfo.reference}</span></p>
          )}
        </div>
        <div className="mt-6 flex items-center space-x-4">
          <Link to="/stores" className="px-4 py-2 bg-indigo-600 text-white rounded">Continue Shopping</Link>
          <Link to="/" className="text-indigo-600 hover:text-indigo-800">Go Home</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Checkout</h2>
      {items.length === 0 ? (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>Your cart is empty.</p>
          <div className="mt-3">
            <Link to="/stores" className="text-indigo-600 hover:text-indigo-800">Browse Stores</Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Delivery Address</div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={address.name} onChange={e => setAddress(a => ({...a, name: e.target.value}))} placeholder="Full Name" className="border rounded px-3 py-2" />
              <input value={address.phone} onChange={e => setAddress(a => ({...a, phone: e.target.value}))} placeholder="Phone (10 digits)" className={`border rounded px-3 py-2 ${address.phone && !isValidPhone(address.phone) ? 'border-red-400' : ''}`} />
              <input value={address.line1} onChange={e => setAddress(a => ({...a, line1: e.target.value}))} placeholder="Address line 1" className="border rounded px-3 py-2 md:col-span-2" />
              <input value={address.line2} onChange={e => setAddress(a => ({...a, line2: e.target.value}))} placeholder="Address line 2 (optional)" className="border rounded px-3 py-2 md:col-span-2" />
              <input value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))} placeholder="City" className="border rounded px-3 py-2" />
              <input value={address.pincode} onChange={e => setAddress(a => ({...a, pincode: e.target.value}))} placeholder="Pincode (6 digits)" className={`border rounded px-3 py-2 ${address.pincode && !isValidPincode(address.pincode) ? 'border-red-400' : ''}`} />
            </div>
          </div>

          {/* Delivery Slot */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Preferred Delivery Slot</div>
            <div className="p-4 flex flex-wrap gap-2">
              {[
                { key: 'morning', label: 'Morning 8–11 AM', icon: '🌅' },
                { key: 'afternoon', label: 'Afternoon 12–3 PM', icon: '🌤️' },
                { key: 'evening', label: 'Evening 5–8 PM', icon: '🌙' },
              ].map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setDeliverySlot(s.key)}
                  className={`px-3 py-2 rounded-full text-sm border flex items-center ${deliverySlot === s.key ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-label={`Select ${s.label}`}
                >
                  <span className="mr-1" aria-hidden>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b font-semibold">Order Summary</div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="font-medium" aria-label={method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}>
                  {method === 'cod' ? (
                    <span className="text-2xl" aria-hidden>💵</span>
                  ) : (
                    <span aria-hidden>
                      <span className="text-2xl">💳</span>
                      <span className="text-2xl ml-1">📱</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Delivery Slot</div>
                <div className="font-medium">
                  {deliverySlot === 'morning' && <span aria-hidden>🌅 Morning</span>}
                  {deliverySlot === 'afternoon' && <span aria-hidden>🌤️ Afternoon</span>}
                  {deliverySlot === 'evening' && <span aria-hidden>🌙 Evening</span>}
                  {!deliverySlot && <span className="text-gray-500">Not selected</span>}
                </div>
              </div>
              {items.map(item => (
                <div key={item.id} className="flex justify-between">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between"><span className="font-semibold">Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t"><span className="font-semibold">Payable</span><span className="text-xl font-bold">₹{computePayable().toFixed(2)}</span></div>
            </div>
          </div>

          {/* Promo code */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex items-center space-x-3">
            <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter promo code" className="border rounded px-3 py-2 flex-1" />
            <button onClick={applyPromo} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Apply</button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            {method === 'online' ? (
              <button
                onClick={payOnline}
                disabled={loading || !isAddressValid()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Processing...' : 'Pay Online'}
              </button>
            ) : (
              <button
                onClick={placeOrder}
                disabled={loading || !isAddressValid()}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
