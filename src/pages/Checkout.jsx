import React, { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import useCart from '../context/CartContext'
import paymentService from '../services/paymentService'
import { toast } from 'react-toastify'
import { PageFade, PressScale } from '../motion/presets'
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE_DEFAULT, SERVICEABLE_PINCODES } from '../lib/config'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [method, setMethod] = useState('cod')
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    let next = params.get('method')
    if (!next) {
      try { next = localStorage.getItem('checkout_method') || 'cod' } catch {}
    }
    setMethod(next === 'online' ? 'online' : 'cod')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null)
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedSavedIndex, setSelectedSavedIndex] = useState('')
  const [promo, setPromo] = useState('')
  const [discount, setDiscount] = useState(0)
  const [deliverySlot, setDeliverySlot] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [tip, setTip] = useState(0)
  const [requiresPrescription, setRequiresPrescription] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const deliveryFee = Number(totalPrice) >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_DEFAULT
  const [taxRate, setTaxRate] = useState(0.05) // GST default 5%
  const taxAmount = useMemo(() => {
    const base = Math.max(Number(totalPrice) - Number(discount || 0) + Number(deliveryFee || 0), 0)
    return Math.round(base * taxRate)
  }, [totalPrice, discount, deliveryFee, taxRate])

  // Allow switching payment method inline for better UX
  const setPaymentMethod = (m) => {
    const normalized = m === 'online' ? 'online' : 'cod'
    setMethod(normalized)
    try { localStorage.setItem('checkout_method', normalized) } catch {}
    const params = new URLSearchParams(location.search)
    params.set('method', normalized)
    navigate({ pathname: '/checkout', search: params.toString() }, { replace: true })
  }

  const [addressMode, setAddressMode] = useState('saved') // 'saved' | 'new'
  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_addresses')
      const arr = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
      setSavedAddresses(arr)
      if (arr.length > 0) {
        setSelectedSavedIndex('0')
        setAddress(arr[0])
        setAddressMode('saved')
      } else {
        setSelectedSavedIndex('')
        setAddressMode('new')
      }
    } catch {}
  }, [])

  // Detect if the cart contains pharmacy items requiring prescription
  useEffect(() => {
    try {
      const hasPharmacy = Array.isArray(items) && items.some(i => i.requiresPrescription)
      const flag = localStorage.getItem('cart_requires_prescription') === 'true'
      setRequiresPrescription(Boolean(hasPharmacy || flag))
    } catch {
      const hasPharmacy = Array.isArray(items) && items.some(i => i.requiresPrescription)
      setRequiresPrescription(Boolean(hasPharmacy))
    }
  }, [items])

  const onPrescriptionFiles = (e) => {
    const files = Array.from(e.target.files || [])
    setPrescriptions(files)
  }

  // Prefill promo from query param or localStorage and auto-apply once
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const fromQuery = params.get('promo') || params.get('coupon') || ''
    let code = fromQuery
    if (!code) {
      try { code = localStorage.getItem('promo') || '' } catch {}
    }
    if (code) {
      const normalized = String(code).trim()
      setPromo(normalized)
      const upper = normalized.toUpperCase()
      if (upper === 'WELCOME50') {
        setDiscount(50)
        setError('')
      } else if (upper === 'SAVE10') {
        const d = Math.min(Math.round(Number(totalPrice) * 0.1), 100)
        setDiscount(d)
        setError('')
      } else {
        setDiscount(0)
        // Don’t set error here to avoid noisy UI on auto-prefill with unknown codes
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const computePayable = () => {
    const subtotal = totalPrice
    const d = Math.min(discount, subtotal)
    return Math.max(subtotal - d + deliveryFee + taxAmount + Number(tip || 0), 0)
  }

  // Be forgiving: strip non-digits, accept last 10 digits for phone (handles +91/0 prefixes)
  const isValidPhone = (p) => {
    const digits = String(p || '').replace(/\D/g, '')
    if (digits.length < 10) return false
    const last10 = digits.slice(-10)
    return /^[6-9]\d{9}$/.test(last10)
  }
  // Strip spaces/characters for pincode and ensure 6 digits
  const isValidPincode = (pc) => {
    const digits = String(pc || '').replace(/\D/g, '')
    return /^\d{6}$/.test(digits)
  }
  const isServiceablePincode = (pc) => {
    const digits = String(pc || '').replace(/\D/g, '')
    if (!/^\d{6}$/.test(digits)) return false
    // If no configuration provided, allow all
    if (!Array.isArray(SERVICEABLE_PINCODES) || SERVICEABLE_PINCODES.length === 0) return true
    return SERVICEABLE_PINCODES.includes(digits)
  }
  const isAddressValid = () => (
    !!address.name && isValidPhone(address.phone) && !!address.line1 && !!address.city && isValidPincode(address.pincode) && isServiceablePincode(address.pincode) && !!deliverySlot
  )

  const saveCurrentAddress = () => {
    const entry = { ...address }
    if (!entry.name || !isValidPhone(entry.phone) || !entry.line1 || !entry.city || !isValidPincode(entry.pincode)) {
      setError('Fill valid name, phone, address, city, and 6-digit pincode to save.')
      return
    }
    try {
      const next = [...savedAddresses, entry]
      setSavedAddresses(next)
      localStorage.setItem('saved_addresses', JSON.stringify(next))
      setSelectedSavedIndex(String(next.length - 1))
      setAddressMode('saved')
      toast.success('Address saved')
    } catch {}
  }

  const selectSavedAddress = (idxStr) => {
    setSelectedSavedIndex(idxStr)
    const idx = Number(idxStr)
    if (!Number.isFinite(idx)) return
    const entry = savedAddresses[idx]
    if (entry) setAddress(entry)
  }

  const deleteSavedAddress = () => {
    const idx = Number(selectedSavedIndex)
    if (!Number.isFinite(idx)) return
    const next = savedAddresses.filter((_, i) => i !== idx)
    setSavedAddresses(next)
    try { localStorage.setItem('saved_addresses', JSON.stringify(next)) } catch {}
    if (next.length > 0) {
      setSelectedSavedIndex('0')
      setAddress(next[0])
      setAddressMode('saved')
    } else {
      setSelectedSavedIndex('')
      setAddress({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
      setAddressMode('new')
    }
    toast.info('Saved address removed')
  }

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

  const removePromo = () => {
    setPromo('')
    setDiscount(0)
    setError('')
    try { localStorage.removeItem('promo') } catch {}
    const params = new URLSearchParams(location.search)
    params.delete('promo'); params.delete('coupon')
    const qs = params.toString()
    navigate({ pathname: '/checkout', search: qs }, { replace: true })
  }

  const placeOrder = async () => {
    if (items.length === 0) return
    if (!isAddressValid()) {
      setError('Please fill a valid address, phone, pincode, and select a delivery slot.')
      return
    }
    if (requiresPrescription && prescriptions.length === 0) {
      setError('Prescription is required for this order. Please upload before placing the order.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const payload = {
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
        totals: { subtotal: totalPrice, discount, deliveryFee, tax: taxAmount, tip: Number(tip || 0), payable: computePayable() },
        address,
        deliverySlot,
        promo,
        deliveryInstructions,
        prescriptions: prescriptions.map(f => ({ name: f.name, size: f.size, type: f.type })),
        paymentMethod: method || 'cod',
      }
      const data = await orderService.checkout(payload)
      setOrderInfo(data || { reference: 'ORDER-' + Date.now() })
      setSuccess(true)
      clearCart()
      try { localStorage.removeItem('cart_requires_prescription') } catch {}
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
    if (requiresPrescription && prescriptions.length === 0) {
      setError('Prescription is required for this order. Please upload before payment.')
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
          totals: { subtotal: totalPrice, discount, deliveryFee, tax: taxAmount, tip: Number(tip || 0), payable: computePayable() },
          address,
          deliverySlot,
          promo,
          deliveryInstructions,
          prescriptions: prescriptions.map(f => ({ name: f.name, size: f.size, type: f.type })),
          paymentMethod: 'online',
          paymentInfo: { gateway: 'mock', status: 'success', reference: 'PAY-' + Date.now() }
        }
        const data = await orderService.checkout(payload)
        setOrderInfo(data || { reference: 'ORDER-' + Date.now() })
        setSuccess(true)
        clearCart()
        try { localStorage.removeItem('cart_requires_prescription') } catch {}
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
        notes: { city: address.city, pincode: address.pincode, instructions: deliveryInstructions },
        handler: async (response) => {
          try {
            await paymentService.verifyPayment({
              orderId: order.id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            })

            const payload = {
              items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
              totals: { subtotal: totalPrice, discount, deliveryFee, tax: taxAmount, tip: Number(tip || 0), payable: computePayable() },
              address,
              deliverySlot,
              promo,
              deliveryInstructions,
              prescriptions: prescriptions.map(f => ({ name: f.name, size: f.size, type: f.type })),
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
            try { localStorage.removeItem('cart_requires_prescription') } catch {}
          } catch (err) {
            const message = err?.response?.data?.message || 'Payment verification failed. Try again.'
            setError(message)
          }
        },
        theme: { color: '#0B3D91' },
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
      <PageFade className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <h2 className="text-2xl font-bold">Order Confirmed</h2>
          <p className="mt-2">Thank you! Your order has been placed successfully.</p>
          {orderInfo?.reference && (
            <p className="mt-1 text-sm">Reference: <span className="font-medium">{orderInfo.reference}</span></p>
          )}
        </div>
        <div className="mt-6 flex items-center space-x-4">
          <PressScale className="inline-block">
            <Link to="/stores" className="btn-primary">Continue Shopping</Link>
          </PressScale>
          <Link to="/" className="link-brand">Go Home</Link>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Checkout</h2>
      {/* Status summary for a professional feel */}
      {items.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${isAddressValid() ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {isAddressValid() ? 'Address ✔' : 'Address incomplete'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${deliverySlot ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {deliverySlot ? 'Slot selected' : 'Select delivery slot'}
          </span>
          {requiresPrescription && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full ${prescriptions.length > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {prescriptions.length > 0 ? 'Prescription attached' : 'Prescription required'}
            </span>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>Your cart is empty.</p>
          <div className="mt-3">
            <Link to="/stores" className="link-brand">Browse Stores</Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Delivery Address</div>
            <div className="p-4 space-y-3">
              {/* Mode toggle: Use saved vs Add new */}
              <div className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
                <button
                  type="button"
                  onClick={() => savedAddresses.length > 0 && setAddressMode('saved')}
                  className={`px-2 py-0.5 rounded ${addressMode === 'saved' && savedAddresses.length > 0 ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'} ${savedAddresses.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >Use saved</button>
                <button
                  type="button"
                  onClick={() => setAddressMode('new')}
                  className={`ml-1 px-2 py-0.5 rounded ${addressMode === 'new' ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                >Add new</button>
              </div>

              {/* Saved address selector */}
              {addressMode === 'saved' && savedAddresses.length > 0 && (
                <>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedSavedIndex}
                      onChange={e => selectSavedAddress(e.target.value)}
                      className="border rounded px-3 py-2 flex-1 text-sm"
                    >
                      <option value="">Select saved address</option>
                      {savedAddresses.map((a, idx) => (
                        <option key={idx} value={String(idx)}>{a.name} — {a.line1}, {a.city} {a.pincode}</option>
                      ))}
                    </select>
                    <button type="button" onClick={deleteSavedAddress} disabled={selectedSavedIndex === ''} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">Delete</button>
                  </div>
                  {selectedSavedIndex !== '' && (
                    <div className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2">
                      <div className="font-medium">{address.name}</div>
                      <div>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</div>
                      <div>{address.city} — {address.pincode}</div>
                      <div>📞 {address.phone}</div>
                    </div>
                  )}
                </>
              )}

              {/* New address form */}
              {addressMode === 'new' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input value={address.name} onChange={e => setAddress(a => ({...a, name: e.target.value}))} placeholder="Full Name" className="border rounded px-3 py-2" />
                    <input value={address.phone} onChange={e => setAddress(a => ({...a, phone: e.target.value}))} placeholder="Phone (10 digits)" className={`border rounded px-3 py-2 ${address.phone && !isValidPhone(address.phone) ? 'border-red-400' : ''}`} />
                    <input value={address.line1} onChange={e => setAddress(a => ({...a, line1: e.target.value}))} placeholder="Address line 1" className="border rounded px-3 py-2 md:col-span-2" />
                    <input value={address.line2} onChange={e => setAddress(a => ({...a, line2: e.target.value}))} placeholder="Address line 2 (optional)" className="border rounded px-3 py-2 md:col-span-2" />
                    <input value={address.city} onChange={e => setAddress(a => ({...a, city: e.target.value}))} placeholder="City" className="border rounded px-3 py-2" />
                    <input value={address.pincode} onChange={e => setAddress(a => ({...a, pincode: e.target.value}))} placeholder="Pincode (6 digits)" className={`border rounded px-3 py-2 ${address.pincode && (!isValidPincode(address.pincode) || !isServiceablePincode(address.pincode)) ? 'border-red-400' : ''}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={saveCurrentAddress} className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">Save this address</button>
                    {!isServiceablePincode(address.pincode) && isValidPincode(address.pincode) && (
                      <span className="text-sm text-red-600">Looks outside our delivery zone. Try another address or pincode.</span>
                    )}
                    {Array.isArray(SERVICEABLE_PINCODES) && SERVICEABLE_PINCODES.length > 0 && isValidPincode(address.pincode) && isServiceablePincode(address.pincode) && (
                      <span className="text-sm text-green-700">Serviceable area ✔</span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Prescription Upload (Pharmacy) */}
          {requiresPrescription && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b font-semibold">Prescription Upload</div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-gray-700">This order includes pharmacy items. Please upload a valid prescription (image or PDF).</p>
                <input type="file" accept="image/*,.pdf" multiple onChange={onPrescriptionFiles} className="block" />
                {prescriptions.length > 0 ? (
                  <ul className="text-sm text-gray-700 list-disc ml-5">
                    {prescriptions.map((f, idx) => (
                      <li key={idx}>{f.name} ({Math.round((f.size || 0)/1024)} KB)</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-red-700">No files selected. Upload required before payment.</p>
                )}
              </div>
            </div>
          )}

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
                  className={`px-3 py-2 rounded-full text-sm border flex items-center ${deliverySlot === s.key ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  aria-label={`Select ${s.label}`}
                >
                  <span className="mr-1" aria-hidden>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 text-sm text-gray-600">
              {deliverySlot === 'morning' && 'Estimated delivery: Today 8–11 AM'}
              {deliverySlot === 'afternoon' && 'Estimated delivery: Today 12–3 PM'}
              {deliverySlot === 'evening' && 'Estimated delivery: Today 5–8 PM'}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Delivery Instructions</div>
            <div className="p-4">
              <textarea
                value={deliveryInstructions}
                onChange={e => setDeliveryInstructions(e.target.value)}
                placeholder="e.g., Ring the doorbell once, leave at gate, call if needed"
                className="border rounded px-3 py-2 w-full min-h-[80px]"
              />
            </div>
          </div>

          {/* Tip */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Tip Your Delivery Partner (optional)</div>
            <div className="p-4 flex flex-wrap gap-2 items-center">
              {[0, 10, 20, 50].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTip(v)}
                  className={`px-3 py-2 rounded-full text-sm border ${Number(tip) === v ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {v === 0 ? 'No Tip' : `₹${v}`}
                </button>
              ))}
              <input
                type="number"
                min={0}
                value={tip}
                onChange={e => setTip(Math.max(0, Number(e.target.value || 0)))}
                placeholder="Custom ₹"
                className="border rounded px-3 py-2 w-28"
              />
            </div>
          </div>

          {/* Tax Settings */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Tax Settings</div>
            <div className="p-4">
              <div className="text-sm text-gray-600">Select GST rate</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[0, 0.05, 0.12, 0.18].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTaxRate(r)}
                    className={`px-3 py-2 rounded-full text-sm border ${taxRate === r ? 'bg-brand-accent text-white border-brand-accent' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    aria-label={`Set GST ${Math.round(r*100)}%`}
                  >
                    {Math.round(r * 100)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span>Order Summary</span>
            <div className="inline-flex items-center rounded-full border px-2 py-1 text-xs">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`px-2 py-0.5 rounded ${method === 'cod' ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              >COD</button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`ml-1 px-2 py-0.5 rounded ${method === 'online' ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'}`}
              >Online</button>
            </div>
          </div>
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
              <div className="flex justify-between"><span>Delivery Fee {Number(totalPrice) >= FREE_DELIVERY_THRESHOLD ? '(free)' : `(free over ₹${FREE_DELIVERY_THRESHOLD})`}</span><span>₹{deliveryFee.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between"><span>Tax (GST {Math.round(taxRate*100)}%)</span><span>₹{taxAmount.toFixed(2)}</span></div>
              {Number(tip) > 0 && (
                <div className="flex justify-between text-gray-700"><span>Tip</span><span>₹{Number(tip).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t bg-brand-muted rounded px-3 py-2"><span className="font-semibold">Payable</span><span className="text-2xl font-bold text-brand-accent">₹{computePayable().toFixed(2)}</span></div>
              {discount > 0 ? (
                <div className="text-sm text-green-700">You saved ₹{discount.toFixed(0)} with coupon {promo?.toUpperCase()}.</div>
              ) : null}
            </div>
          </div>

          {/* Promo code */}
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
            {promo && discount > 0 ? (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                <span aria-hidden>🏷️</span>
                <span className="ml-2">Applied:</span>
                <span className="font-semibold ml-1">{promo.toUpperCase()}</span>
                <button type="button" onClick={removePromo} className="ml-2 px-2 py-0.5 rounded bg-green-200 hover:bg-green-300">Remove</button>
              </div>
            ) : null}
            <div className="flex items-center space-x-3">
              <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter promo code" className="border rounded px-3 py-2 flex-1" />
              <button onClick={applyPromo} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Apply</button>
            </div>
            <div className="text-sm text-gray-600">
              Try <button type="button" className="underline" onClick={() => setPromo('WELCOME50')}>WELCOME50</button> (₹50 off) or <button type="button" className="underline" onClick={() => setPromo('SAVE10')}>SAVE10</button> (10% up to ₹100).
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            {method === 'online' ? (
              <PressScale className="inline-block">
                <button
                  onClick={payOnline}
                  disabled={loading || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  className="btn-primary disabled:opacity-60"
                >
                  {loading ? 'Processing...' : 'Pay Online'}
                </button>
              </PressScale>
            ) : (
              <PressScale className="inline-block">
                <button
                  onClick={placeOrder}
                  disabled={loading || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  className="btn-primary disabled:opacity-60"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </PressScale>
            )}
          </div>
        </div>
      )}
    </PageFade>
  )
}
