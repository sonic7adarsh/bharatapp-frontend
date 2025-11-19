import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'
import { DrawerRight } from '../motion/presets'
import { FREE_DELIVERY_THRESHOLD } from '../lib/config'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { items, itemsCount, totalPrice, updateItemQuantity, removeItem, clearCart } = useCart()
  const { announce } = useAnnouncer()

  const progress = useMemo(() => {
    const pct = Math.min(100, Math.round((Number(totalPrice) / FREE_DELIVERY_THRESHOLD) * 100))
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - Number(totalPrice))
    return { pct, remaining }
  }, [totalPrice])

  const [promo, setPromo] = useState('')
  const [allowSubs, setAllowSubs] = useState(true)

  useEffect(() => {
    try {
      const savedPromo = localStorage.getItem('promo') || ''
      const savedSubs = localStorage.getItem('allow_substitutions')
      setPromo(savedPromo)
      setAllowSubs(savedSubs === null ? true : savedSubs === 'true')
    } catch {}
  }, [])

  // Announce drawer open/close and key updates
  useEffect(() => {
    if (isOpen) {
      announce(items.length === 0 ? 'Cart opened. Your cart is empty.' : `Cart opened. ${itemsCount} items, subtotal ₹${Number(totalPrice).toFixed(0)}.`, 'polite')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    announce(items.length === 0 ? 'Your cart is now empty.' : `Cart updated. ${itemsCount} items, subtotal ₹${Number(totalPrice).toFixed(0)}.`, 'polite')
  }, [itemsCount, totalPrice, items.length, isOpen])

  const applyPromo = () => {
    try { localStorage.setItem('promo', promo) } catch {}
    const code = String(promo || '').trim()
    if (code) announce(`Coupon applied: ${code.toUpperCase()}.`, 'polite')
  }

  const toggleSubs = () => {
    const next = !allowSubs
    setAllowSubs(next)
    try { localStorage.setItem('allow_substitutions', String(next)) } catch {}
    announce(next ? 'Substitutions enabled.' : 'Substitutions disabled.', 'polite')
  }

  const increment = (id, current) => updateItemQuantity(id, current + 1)
  const decrement = (id, current) => {
    const next = current - 1
    if (next <= 0) removeItem(id)
    else updateItemQuantity(id, next)
  }

  const goToCheckout = () => {
    onClose?.()
    const code = String(promo || '').trim()
    const params = new URLSearchParams()
    if (code) params.set('promo', code)
    const qs = params.toString()
    announce('Proceeding to checkout options.', 'polite')
    navigate(`/checkout/options${qs ? `?${qs}` : ''}`)
  }

  return (
    <DrawerRight id="cart-drawer" isOpen={isOpen} onClose={onClose} widthClass="w-full sm:w-[420px]" ariaLabel="Shopping cart">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-semibold" id="cart-title">Your Cart</div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-900" aria-label="Close cart">✕</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 py-12">Your cart is empty.</div>
          ) : (
            items.map(item => (
              <div key={item.id} className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">₹{Number(item.price).toFixed(0)} each</div>
                </div>
                <div className="flex items-center">
                  <button onClick={() => decrement(item.id, item.quantity)} className="px-3 py-1 rounded-l-md bg-brand-muted hover:bg-orange-100" aria-label={`Decrease quantity for ${item.name}`}>−</button>
                  <span className="px-3 py-1 font-semibold bg-brand-muted" aria-live="polite">{item.quantity}</span>
                  <button onClick={() => increment(item.id, item.quantity)} className="px-3 py-1 rounded-r-md bg-brand-muted hover:bg-orange-100" aria-label={`Increase quantity for ${item.name}`}>+</button>
                </div>
                <div className="text-right min-w-[60px] font-semibold">₹{(item.price * item.quantity).toFixed(0)}</div>
                <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-700 text-sm" aria-label={`Remove ${item.name}`}>Remove</button>
              </div>
            ))
          )}

          {/* Threshold progress */}
          <div className="mt-2" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Free delivery threshold</span>
              <span className="font-medium">₹{FREE_DELIVERY_THRESHOLD}</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-brand-primary rounded-full"
                style={{ width: `${progress.pct}%` }}
                role="progressbar"
                aria-valuenow={progress.pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress toward free delivery"
              ></div>
            </div>
            {progress.remaining > 0 ? (
              <div className="text-xs text-gray-600 mt-1">Add ₹{progress.remaining.toFixed(0)} more for free delivery</div>
            ) : (
              <div className="text-xs text-green-600 mt-1">You’ve unlocked free delivery!</div>
            )}
          </div>

          {/* Coupon & substitutions */}
          <div className="flex items-center gap-2">
            <label htmlFor="cart-promo" className="sr-only">Coupon code</label>
            <input
              type="text"
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Apply coupon"
              className="flex-1 border rounded-md px-3 py-2"
              id="cart-promo"
              aria-describedby="cart-promo-help"
            />
            <button onClick={applyPromo} className="px-3 py-2 rounded-md border hover:bg-gray-50" aria-label="Apply coupon">Apply</button>
            <span id="cart-promo-help" className="sr-only">Enter your coupon and press Apply</span>
          </div>
          <div className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input id="allow-subs" type="checkbox" checked={allowSubs} onChange={toggleSubs} aria-checked={allowSubs} />
            <label htmlFor="allow-subs">Allow substitutions if items are unavailable</label>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center justify-between" aria-live="polite">
            <div className="text-gray-700">Items</div>
            <div className="font-semibold">{itemsCount}</div>
          </div>
          <div className="flex items-center justify-between" aria-live="polite">
            <div className="font-semibold">Subtotal</div>
            <div className="text-xl font-bold">₹{Number(totalPrice).toFixed(0)}</div>
          </div>
          <div className="flex gap-2">
          <button
            onClick={clearCart}
            className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition"
            aria-label="Clear cart"
            title="Clear Cart"
          >
            <span>🧹</span>
            <span className="font-medium">Clear</span>
          </button>
            <Link to="/cart" onClick={onClose} className="px-3 py-2 rounded-md border hover:bg-gray-50" aria-label="View full cart">View Cart</Link>
            <button onClick={goToCheckout} className="flex-1 btn-primary" disabled={items.length === 0} aria-disabled={items.length === 0} aria-label="Proceed to checkout">Checkout</button>
          </div>
        </div>
      </div>
    </DrawerRight>
  )
}