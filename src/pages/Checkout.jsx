import React, { useMemo, useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import useCart from '../context/CartContext'
import paymentService from '../services/paymentService'
import { toast } from 'react-toastify'
import { PageFade, PressScale } from '../motion/presets'
import { FREE_DELIVERY_THRESHOLD, DELIVERY_FEE_DEFAULT, SERVICEABLE_PINCODES } from '../lib/config'
import { isNavKey, nextIndexForKey } from '../lib/keyboard'
import { useAnnouncer } from '../context/AnnouncerContext'
import useAuth from '../hooks/useAuth'

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const { announce } = useAnnouncer()
  const { isAuthenticated } = useAuth()
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
  const [taxRate, setTaxRate] = useState(0) // Prices are inclusive of taxes
  const [showSavedSelector, setShowSavedSelector] = useState(false)
  const taxAmount = useMemo(() => {
    const base = Math.max(Number(totalPrice) - Number(discount || 0) + Number(deliveryFee || 0), 0)
    return Math.round(base * taxRate)
  }, [totalPrice, discount, deliveryFee, taxRate])

  // Announce changes to key selections
  useEffect(() => {
    if (!deliverySlot) return
    const labels = { morning: 'Morning 8–11 AM', afternoon: 'Afternoon 12–3 PM', evening: 'Evening 5–8 PM' }
    const label = labels[deliverySlot] || deliverySlot
    announce(`Preferred delivery slot: ${label}.`, 'polite')
  }, [deliverySlot])

  useEffect(() => {
    if (Number(tip) >= 0) {
      announce(Number(tip) === 0 ? 'Tip set to: No tip.' : `Tip set to: ₹${Number(tip)}.`, 'polite')
    }
  }, [tip])

  useEffect(() => {
    announce(`GST rate set to ${Math.round(taxRate * 100)}%.`, 'polite')
  }, [taxRate])

  // Allow switching payment method inline for better UX
  const setPaymentMethod = (m) => {
    const normalized = m === 'online' ? 'online' : 'cod'
    setMethod(normalized)
    announce(normalized === 'cod' ? 'Payment method: Cash on Delivery selected.' : 'Payment method: Online payment selected.', 'polite')
    try { localStorage.setItem('checkout_method', normalized) } catch {}
    const params = new URLSearchParams(location.search)
    params.set('method', normalized)
    navigate({ pathname: '/checkout', search: params.toString() }, { replace: true })
  }

  const [addressMode, setAddressMode] = useState('saved') // modal-based add
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressModalTab, setAddressModalTab] = useState('saved') // 'saved' | 'edit'
  const [modalSelectedIndex, setModalSelectedIndex] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
  useEffect(() => {
    try {
      const raw = localStorage.getItem('saved_addresses')
      const arr = Array.isArray(raw ? JSON.parse(raw) : null) ? JSON.parse(raw) : []
      setSavedAddresses(arr)
      if (arr.length > 0) {
        setSelectedSavedIndex('0')
        setAddress(arr[0])
        setAddressMode('saved')
        setShowSavedSelector(true)
      } else {
        setSelectedSavedIndex('')
        setAddressMode('new')
        setShowSavedSelector(false)
      }
    } catch {}
  }, [])

  useEffect(() => {
    announce('Using saved address mode.', 'polite')
  }, [])

  const openAddressModal = () => {
    // Open unified selector modal; default to saved list if available
    const hasSaved = savedAddresses.length > 0
    setAddressModalTab(hasSaved ? 'saved' : 'edit')
    setModalSelectedIndex(hasSaved ? (selectedSavedIndex || '0') : '')
    setEditingIndex(null)
    setNewAddress({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
    setIsAddressModalOpen(true)
    announce('Select Address dialog opened.', 'polite')
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    announce('Address dialog closed.', 'polite')
  }

  const saveNewAddress = () => {
    const entry = { ...newAddress }
    if (!entry.name || !isValidPhone(entry.phone) || !entry.line1 || !entry.city || !isValidPincode(entry.pincode)) {
      setError('Fill valid name, phone, address, city, and 6-digit pincode to save.')
      return
    }
    try {
      let next = [...savedAddresses]
      if (Number.isFinite(editingIndex)) {
        next[editingIndex] = entry
        toast.success('Address updated')
        setSelectedSavedIndex(String(editingIndex))
      } else {
        next = [...next, entry]
        toast.success('Address saved')
        setSelectedSavedIndex(String(next.length - 1))
      }
      setSavedAddresses(next)
      localStorage.setItem('saved_addresses', JSON.stringify(next))
      setAddress(entry)
      setAddressMode('saved')
      setAddressModalTab('saved')
      setEditingIndex(null)
    } catch {}
  }

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
    if (entry) {
      setAddress(entry)
      announce(`Selected saved address: ${entry.line1 || ''}, ${entry.city || ''}.`, 'polite')
    }
  }

  const applySelectedAddressFromModal = () => {
    if (modalSelectedIndex === '') return
    selectSavedAddress(modalSelectedIndex)
    closeAddressModal()
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

  const deleteSavedAddressAt = (idx) => {
    if (!Number.isFinite(idx)) return
    const next = savedAddresses.filter((_, i) => i !== idx)
    setSavedAddresses(next)
    try { localStorage.setItem('saved_addresses', JSON.stringify(next)) } catch {}
    const newSel = next.length > 0 ? '0' : ''
    setSelectedSavedIndex(newSel)
    if (newSel !== '') setAddress(next[0]); else setAddress({ name: '', phone: '', line1: '', line2: '', city: '', pincode: '' })
    setAddressMode(next.length > 0 ? 'saved' : 'new')
    setModalSelectedIndex(newSel)
    toast.info('Saved address removed')
  }

  const applyPromo = () => {
    const code = promo.trim().toUpperCase()
    if (!code) return
    if (code === 'WELCOME50') {
      setDiscount(50)
      setError('')
      announce('Coupon applied: WELCOME50. ₹50 discount added.', 'polite')
    } else if (code === 'SAVE10') {
      const d = Math.min(Math.round(totalPrice * 0.1), 100)
      setDiscount(d)
      setError('')
      announce(`Coupon applied: SAVE10. ${d === 0 ? 'No discount' : `₹${d} discount added`}.`, 'polite')
    } else {
      setDiscount(0)
      setError('Invalid promo code')
      announce('Invalid promo code.', 'assertive')
    }
  }

  const removePromo = () => {
    setPromo('')
    setDiscount(0)
    setError('')
    try { localStorage.removeItem('promo') } catch {}
    const params = new URLSearchParams(location.search)
    params.delete('promo'); params.delete('coupon')
    announce('Coupon removed.', 'polite')
    const qs = params.toString()
    navigate({ pathname: '/checkout', search: qs }, { replace: true })
  }

  const placeOrder = async () => {
    if (!isAuthenticated) {
      navigate('/mobile-login', { state: { from: location.pathname + location.search } })
      return
    }
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
    if (!isAuthenticated) {
      navigate('/mobile-login', { state: { from: location.pathname + location.search } })
      return
    }
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
        const txid = 'PAY-' + Date.now()
        const payload = {
          items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
          totals: { subtotal: totalPrice, discount, deliveryFee, tax: taxAmount, tip: Number(tip || 0), payable: computePayable() },
          address,
          deliverySlot,
          promo,
          deliveryInstructions,
          prescriptions: prescriptions.map(f => ({ name: f.name, size: f.size, type: f.type })),
          paymentMethod: 'online',
          paymentInfo: { gateway: 'mock', status: 'success', transactionId: txid, reference: txid }
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
                transactionId: response.razorpay_payment_id,
                status: 'success',
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
    <PageFade className="max-w-3xl mx-auto px-4 py-6" aria-busy={loading} aria-labelledby="checkout-title">
      <h2 id="checkout-title" className="text-2xl font-bold">Checkout</h2>
      <a href="#order-summary-title" className="sr-only focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-brand-accent rounded px-2 py-1">Skip to order summary</a>
      {/* Step progress announcements for screen readers */}
      <div id="checkout-progress" className="sr-only" role="status" aria-live="polite">
        {isAddressValid() ? 'Address complete.' : 'Address incomplete.'}
        {' '}
        {deliverySlot ? (
          deliverySlot === 'morning' ? 'Delivery slot selected: Morning 8–11 AM.' :
          deliverySlot === 'afternoon' ? 'Delivery slot selected: Afternoon 12–3 PM.' :
          deliverySlot === 'evening' ? 'Delivery slot selected: Evening 5–8 PM.' :
          'Delivery slot selected.'
        ) : 'Delivery slot not selected.'}
        {' '}
        {requiresPrescription ? (prescriptions.length > 0 ? 'Prescription attached.' : 'Prescription required.') : ''}
      </div>
      {items.length === 0 ? (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>Your cart is empty.</p>
          <div className="mt-3">
            <Link to="/stores" className="link-brand">Browse Stores</Link>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,480px)] gap-4">
          <div className="space-y-4">
          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold flex items-center justify-between">
              <span>Delivery Address</span>
              <button type="button" onClick={openAddressModal} className="btn-outline text-xs sm:text-sm px-2 py-1">Select address</button>
            </div>
            <div className="p-4 space-y-3">
              {/* Selected address preview */}
              {address?.name && address?.line1 && address?.city && address?.pincode ? (
                <div className="text-sm text-gray-700 bg-gray-50 rounded px-3 py-2 break-words">
                  <div className="font-medium">{address.name}</div>
                  <div>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</div>
                  <div>{address.city} — {address.pincode}</div>
                  {address.phone && <div className="text-gray-600">📞 {address.phone}</div>}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No address selected</div>
              )}

              {/* Saved selector removed in favor of unified modal */}

              {/* Modal for new address */}
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
            <div className="p-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Preferred delivery slot">
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
                  role="radio"
                  aria-checked={deliverySlot === s.key}
                  id={`slot-${s.key}`}
                  tabIndex={deliverySlot === s.key ? 0 : -1}
                  onKeyDown={(e) => {
                    const list = ['morning','afternoon','evening']
                    const idx = list.indexOf(s.key)
                    const key = e.key
                    const targetIdx = nextIndexForKey(idx, list.length, key)
                    if (isNavKey(key)) {
                      setDeliverySlot(list[targetIdx])
                      e.preventDefault()
                    }
                  }}
                >
              <span className="mr-1" aria-hidden="true">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="px-4 pb-4 text-sm text-gray-600" aria-live="polite">
              {deliverySlot === 'morning' && 'Estimated delivery: Today 8–11 AM'}
              {deliverySlot === 'afternoon' && 'Estimated delivery: Today 12–3 PM'}
              {deliverySlot === 'evening' && 'Estimated delivery: Today 5–8 PM'}
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b font-semibold">Delivery Instructions</div>
            <div className="p-4">
              <label htmlFor="delivery-notes" className="text-sm font-medium">Add instructions for the rider</label>
              <textarea
                id="delivery-notes"
                value={deliveryInstructions}
                onChange={e => setDeliveryInstructions(e.target.value)}
                placeholder="e.g., Ring the doorbell once, leave at gate, call if needed"
                className="mt-1 border rounded px-3 py-2 w-full min-h-[80px]"
              />
            </div>
          </div>

          {/* Tip and Tax sections removed per request */}
          </div>
          <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm" id="order-summary">
          <div className="p-4 border-b font-semibold flex items-center justify-between">
            <span id="order-summary-title" tabIndex={-1}>Order Summary</span>
            <div className="inline-flex items-center rounded-full border px-2 py-1 text-xs" role="radiogroup" aria-label="Payment method">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`px-2 py-0.5 rounded ${method === 'cod' ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                role="radio"
                aria-checked={method === 'cod'}
                id="pay-cod"
                tabIndex={method === 'cod' ? 0 : -1}
                onKeyDown={(e) => {
                  const list = ['cod','online']
                  const idx = 0
                  const key = e.key
                  const targetIdx = nextIndexForKey(idx, list.length, key)
                  if (isNavKey(key)) {
                    setPaymentMethod(list[targetIdx])
                    e.preventDefault()
                  }
                }}
              >COD</button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`ml-1 px-2 py-0.5 rounded ${method === 'online' ? 'bg-brand-accent text-white' : 'text-gray-700 hover:bg-gray-50'}`}
                role="radio"
                aria-checked={method === 'online'}
                id="pay-online"
                tabIndex={method === 'online' ? 0 : -1}
                onKeyDown={(e) => {
                  const list = ['cod','online']
                  const idx = 1
                  const key = e.key
                  const targetIdx = nextIndexForKey(idx, list.length, key)
                  if (isNavKey(key)) {
                    setPaymentMethod(list[targetIdx])
                    e.preventDefault()
                  }
                }}
              >Online</button>
            </div>
          </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Payment Method</div>
                <div className="font-medium" aria-label={method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}>
                  {method === 'cod' ? (
            <span className="text-2xl" aria-hidden="true">💵</span>
                  ) : (
            <span aria-hidden="true">
                      <span className="text-2xl">💳</span>
                      <span className="text-2xl ml-1">📱</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600" aria-live="polite" role="status">
                {method === 'online' ? (
              <span><span aria-hidden="true">🔒</span> Secure online payment via encrypted gateway</span>
                ) : (
                  <span>Pay in cash at delivery. No online payment needed.</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">Delivery Slot</div>
                <div className="font-medium">
            {deliverySlot === 'morning' && <span aria-hidden="true">🌅 Morning</span>}
            {deliverySlot === 'afternoon' && <span aria-hidden="true">🌤️ Afternoon</span>}
            {deliverySlot === 'evening' && <span aria-hidden="true">🌙 Evening</span>}
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
            <div className="p-4 border-t space-y-2" aria-live="polite">
              <div className="flex justify-between"><span className="font-semibold">Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Delivery Fee {Number(totalPrice) >= FREE_DELIVERY_THRESHOLD ? '(free)' : `(free over ₹${FREE_DELIVERY_THRESHOLD})`}</span><span>₹{deliveryFee.toFixed(2)}</span></div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>
              )}
              {/* Tax line removed: prices are inclusive */}
              {Number(tip) > 0 && (
                <div className="flex justify-between text-gray-700"><span>Tip</span><span>₹{Number(tip).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t bg-brand-muted rounded px-3 py-2"><span className="font-semibold">Payable</span><span className="text-2xl font-bold text-brand-accent">₹{computePayable().toFixed(2)}</span></div>
              <div className="text-xs text-gray-600">Rates inclusive of taxes.</div>
              {discount > 0 ? (
                <div className="text-sm text-green-700">You saved ₹{discount.toFixed(0)} with coupon {promo?.toUpperCase()}.</div>
              ) : null}

              {/* Promo code (inline inside Order Summary for proper alignment) */}
              {promo && discount > 0 ? (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm" role="status" aria-live="polite">
                  <span aria-hidden="true">🏷️</span>
                  <span className="ml-2">Applied:</span>
                  <span className="font-semibold ml-1">{promo.toUpperCase()}</span>
                  <button type="button" onClick={removePromo} className="ml-2 px-2 py-0.5 rounded bg-green-200 hover:bg-green-300">Remove</button>
                </div>
              ) : null}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                <label htmlFor="promo-code" className="sr-only">Promo code</label>
                <input id="promo-code" value={promo} onChange={e => setPromo(e.target.value)} placeholder="Enter promo code" className="border rounded px-3 py-2 w-full" />
                <button onClick={applyPromo} className="btn-primary">Apply</button>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Try <button type="button" className="underline" onClick={() => setPromo('WELCOME50')}>WELCOME50</button> (₹50 off) or <button type="button" className="underline" onClick={() => setPromo('SAVE10')}>SAVE10</button> (10% up to ₹100).
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert" aria-live="assertive">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            {method === 'online' ? (
              <PressScale className="inline-block">
                <button
                  onClick={payOnline}
                  disabled={loading || !isAuthenticated || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  className="btn-primary disabled:opacity-60"
                  aria-disabled={loading || !isAuthenticated || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  aria-label={`Pay Online, amount ₹${computePayable().toFixed(2)}`}
                >
                  {loading ? 'Processing...' : 'Pay Online'}
                </button>
              </PressScale>
            ) : (
              <PressScale className="inline-block">
                <button
                  onClick={placeOrder}
                  disabled={loading || !isAuthenticated || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  className="btn-primary disabled:opacity-60"
                  aria-disabled={loading || !isAuthenticated || !isAddressValid() || (requiresPrescription && prescriptions.length === 0)}
                  aria-label={`Place Order, amount ₹${computePayable().toFixed(2)}`}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
          </PressScale>
            )}
          </div>
        </div>
        </div>
      )}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" aria-live="polite">
          <div className="fixed inset-0 bg-black/40" onClick={closeAddressModal} aria-hidden="true"></div>
          <div role="dialog" aria-modal="true" aria-labelledby="address-dialog-title" className="relative z-10 bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b">
              <div className="font-semibold" id="address-dialog-title">Select Address</div>
            </div>
            <div className="p-4 space-y-4">
              {addressModalTab === 'saved' ? (
                savedAddresses.length === 0 ? (
                  <div className="text-sm text-gray-700">
                    No saved addresses yet.
                    <div className="mt-3">
                      <button type="button" onClick={() => setAddressModalTab('edit')} className="btn-outline text-sm px-2 py-1">Add new address</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedAddresses.map((a, idx) => (
                      <div key={idx} className="border rounded p-3 flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input type="radio" name="addr-select" value={String(idx)} checked={modalSelectedIndex === String(idx)} onChange={e => setModalSelectedIndex(e.target.value)} className="mt-1" aria-label={`Select address ${a.name}`} />
                          <div className="text-sm">
                            <div className="font-medium">{a.name}</div>
                            <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
                            <div>{a.city} — {a.pincode}</div>
                            <div className="text-gray-600">📞 {a.phone}</div>
                          </div>
                        </label>
                        <div className="flex items-center gap-2 shrink-0">
                          <button type="button" onClick={() => { setEditingIndex(idx); setNewAddress(a); setAddressModalTab('edit') }} className="px-2 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">Edit</button>
                          <button type="button" onClick={() => deleteSavedAddressAt(idx)} className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="new-addr-name" className="text-sm font-medium">Full Name</label>
                      <input id="new-addr-name" value={newAddress.name} onChange={e => setNewAddress(a => ({...a, name: e.target.value}))} placeholder="e.g., Adarsh Kumar" className="border rounded px-3 py-2 w-full" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="new-addr-phone" className="text-sm font-medium">Phone</label>
                      <input id="new-addr-phone" value={newAddress.phone} onChange={e => setNewAddress(a => ({...a, phone: e.target.value}))} placeholder="10 digits" aria-invalid={Boolean(newAddress.phone && !isValidPhone(newAddress.phone))} aria-describedby="new-phone-help" className={`border rounded px-3 py-2 w-full ${newAddress.phone && !isValidPhone(newAddress.phone) ? 'border-red-400' : ''}`} />
                      <span id="new-phone-help" className="sr-only">Enter a 10-digit mobile number</span>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="new-addr-line1" className="text-sm font-medium">Address line 1</label>
                      <input id="new-addr-line1" value={newAddress.line1} onChange={e => setNewAddress(a => ({...a, line1: e.target.value}))} placeholder="House/Flat, Street" className="border rounded px-3 py-2 w-full" />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label htmlFor="new-addr-line2" className="text-sm font-medium">Address line 2 (optional)</label>
                      <input id="new-addr-line2" value={newAddress.line2} onChange={e => setNewAddress(a => ({...a, line2: e.target.value}))} placeholder="Area, Landmark" className="border rounded px-3 py-2 w-full" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="new-addr-city" className="text-sm font-medium">City</label>
                      <input id="new-addr-city" value={newAddress.city} onChange={e => setNewAddress(a => ({...a, city: e.target.value}))} placeholder="e.g., Bengaluru" className="border rounded px-3 py-2 w-full" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="new-addr-pincode" className="text-sm font-medium">Pincode</label>
                      <input id="new-addr-pincode" value={newAddress.pincode} onChange={e => setNewAddress(a => ({...a, pincode: e.target.value}))} placeholder="6 digits" aria-invalid={Boolean(newAddress.pincode && (!isValidPincode(newAddress.pincode) || !isServiceablePincode(newAddress.pincode)))} aria-describedby="new-pincode-help" className={`border rounded px-3 py-2 w-full ${newAddress.pincode && (!isValidPincode(newAddress.pincode) || !isServiceablePincode(newAddress.pincode)) ? 'border-red-400' : ''}`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap" id="new-pincode-help" aria-live="polite">
                    {!isServiceablePincode(newAddress.pincode) && isValidPincode(newAddress.pincode) && (
                      <span className="text-sm text-red-600" role="status">Looks outside our delivery zone. Try another address or pincode.</span>
                    )}
                    {Array.isArray(SERVICEABLE_PINCODES) && SERVICEABLE_PINCODES.length > 0 && isValidPincode(newAddress.pincode) && isServiceablePincode(newAddress.pincode) && (
                      <span className="text-sm text-green-700" role="status">Serviceable area ✔</span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="p-4 border-t flex justify-between items-center gap-2">
              {addressModalTab === 'saved' ? (
                <>
                  <button type="button" onClick={() => { setEditingIndex(null); setNewAddress({ name:'', phone:'', line1:'', line2:'', city:'', pincode:'' }); setAddressModalTab('edit') }} className="btn-outline text-sm">Add new address</button>
                  <div className="flex gap-2">
                    <button type="button" onClick={closeAddressModal} className="btn-outline text-sm">Cancel</button>
                    <button type="button" onClick={applySelectedAddressFromModal} disabled={modalSelectedIndex === ''} className="btn-primary text-sm disabled:opacity-60">Use selected</button>
                  </div>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => { const hasSaved = savedAddresses.length > 0; hasSaved ? setAddressModalTab('saved') : closeAddressModal() }} className="btn-outline text-sm">Cancel</button>
                  <button type="button" onClick={saveNewAddress} className="btn-primary text-sm">{Number.isFinite(editingIndex) ? 'Update Address' : 'Save Address'}</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </PageFade>
  )
}
