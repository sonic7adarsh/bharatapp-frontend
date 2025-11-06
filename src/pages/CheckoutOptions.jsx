import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useCart from '../context/CartContext'
import { PageFade, PressScale } from '../motion/presets'
import { isNavKey, nextIndexForKey } from '../lib/keyboard'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function CheckoutOptions() {
  const navigate = useNavigate()
  const location = useLocation()
  const { items, totalPrice } = useCart()
  const [method, setMethod] = useState('cod')
  const { announce } = useAnnouncer()

  // Read promo from query and lightly persist so Checkout can prefill
  const promo = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('promo') || ''
  }, [location.search])

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/cart')
    }
  }, [items, navigate])

  useEffect(() => {
    if (promo) {
      try { localStorage.setItem('promo', promo) } catch {}
    }
  }, [promo])

  const continueCheckout = () => {
    // Persist choice lightly and navigate with query param
    try { localStorage.setItem('checkout_method', method) } catch {}
    announce(method === 'cod' ? 'Payment method: Cash on Delivery selected. Continuing to checkout.' : 'Payment method: Online payment selected. Continuing to checkout.', 'polite')
    const qs = new URLSearchParams({ method }).toString()
    const next = promo ? `${qs}&promo=${encodeURIComponent(promo)}` : qs
    navigate(`/checkout?${next}`)
  }

  return (
    <PageFade className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold" id="choose-pay-title">Choose Payment Method</h2>
      <p className="text-gray-600 mt-1" id="choose-pay-hint">Tap an icon or use arrow keys to choose how you want to pay.</p>

      <div className="mt-4 space-y-4">
        {/* Icon-only selection tiles with radiogroup semantics */}
        <div
          className="grid grid-cols-2 gap-4"
          role="radiogroup"
          aria-labelledby="choose-pay-title"
          aria-describedby="choose-pay-hint"
        >
          <button
            type="button"
            onClick={() => { setMethod('cod'); announce('Payment method: Cash on Delivery selected.', 'polite') }}
            aria-label="Cash on Delivery"
            className={`bg-white rounded-lg shadow-sm p-6 flex items-center justify-center hover:ring-2 hover:ring-brand-accentLight transition ${method === 'cod' ? 'ring-2 ring-brand-accent' : ''}`}
            role="radio"
            aria-checked={method === 'cod'}
            id="pay-cod-tile"
            tabIndex={method === 'cod' ? 0 : -1}
            onKeyDown={(e) => {
              const list = ['cod','online']
              const idx = 0
              const key = e.key
              const targetIdx = nextIndexForKey(idx, list.length, key)
              if (isNavKey(key)) {
                const next = list[targetIdx]
                setMethod(next)
                announce(next === 'cod' ? 'Payment method: Cash on Delivery selected.' : 'Payment method: Online payment selected.', 'polite')
                e.preventDefault()
              }
            }}
          >
        <span className="text-5xl" aria-hidden="true">💵</span>
            <span className="sr-only">Cash on Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => { setMethod('online'); announce('Payment method: Online payment selected.', 'polite') }}
            aria-label="Online Payment (Card/UPI)"
            className={`bg-white rounded-lg shadow-sm p-6 flex items-center justify-center hover:ring-2 hover:ring-brand-accentLight transition ${method === 'online' ? 'ring-2 ring-brand-accent' : ''}`}
            role="radio"
            aria-checked={method === 'online'}
            id="pay-online-tile"
            tabIndex={method === 'online' ? 0 : -1}
            onKeyDown={(e) => {
              const list = ['cod','online']
              const idx = 1
              const key = e.key
              const targetIdx = nextIndexForKey(idx, list.length, key)
              if (isNavKey(key)) {
                const next = list[targetIdx]
                setMethod(next)
                announce(next === 'cod' ? 'Payment method: Cash on Delivery selected.' : 'Payment method: Online payment selected.', 'polite')
                e.preventDefault()
              }
            }}
          >
        <span className="text-5xl" aria-hidden="true">💳</span>
        <span className="text-4xl ml-2" aria-hidden="true">📱</span>
            <span className="sr-only">Online Payment (Card/UPI)</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-brand-muted border border-orange-100 rounded-md p-4">
          <div className="font-semibold">Cart Total</div>
          <div className="text-xl font-bold">₹{Number(totalPrice).toFixed(2)}</div>
        </div>
        {promo ? (
          <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm">
        <span aria-hidden="true">🏷️</span>
            <span className="ml-2">Coupon:</span>
            <span className="font-semibold ml-1">{promo.toUpperCase()}</span>
            <button
              type="button"
              onClick={() => { try { localStorage.removeItem('promo') } catch {}; navigate('/checkout/options') }}
              className="ml-2 px-2 py-0.5 rounded bg-green-200 hover:bg-green-300"
              aria-label="Remove coupon"
            >
              Remove
            </button>
          </div>
        ) : null}

        <div className="flex justify-end">
          <PressScale className="inline-block">
            <button onClick={continueCheckout} className="btn-primary">
              Continue to Checkout
            </button>
          </PressScale>
        </div>
      </div>
    </PageFade>
  )
}