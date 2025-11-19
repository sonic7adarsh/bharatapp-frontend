import React, { useMemo } from 'react'
import useCart from '../context/CartContext'
import { Link } from 'react-router-dom'
import { PageFade, PressScale } from '../motion/presets'
import { FREE_DELIVERY_THRESHOLD } from '../lib/config'

export default function Cart() {
  const { items, updateItemQuantity, removeItem, clearCart, totalPrice } = useCart()

  const increment = (id, current) => {
    updateItemQuantity(id, current + 1)
  }

  const decrement = (id, current) => {
    const next = current - 1
    if (next <= 0) {
      removeItem(id)
    } else {
      updateItemQuantity(id, next)
    }
  }

  const itemsCount = useMemo(() => items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0), [items])
  const progress = useMemo(() => {
    const pct = Math.min(100, Math.round((Number(totalPrice) / FREE_DELIVERY_THRESHOLD) * 100))
    const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - Number(totalPrice))
    return { pct, remaining }
  }, [totalPrice])

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Your Cart</h2>
      {items.length === 0 ? (
        <div className="mt-4 bg-gray-50 border border-gray-200 text-gray-700 px-6 py-5 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 text-gray-700">🛒</span>
            <div>
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm text-gray-600">Discover local stores and add items to continue.</p>
            </div>
          </div>
          <div className="mt-4">
            <PressScale className="inline-block">
              <Link to="/stores" className="btn-primary">Browse Stores</Link>
            </PressScale>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Items list */}
          <div className="space-y-4 md:col-span-2">
            {items.map(item => (
              <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    <span>{item.name}</span>
                    {item.requiresPrescription && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">Pharmacy</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">₹{Number(item.price).toFixed(0)} each</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="inline-flex items-center border rounded">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => decrement(item.id, item.quantity)}
                      className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                    >
                      −
                    </button>
                    <div className="px-4 py-1 min-w-[2.5rem] text-center font-medium" aria-live="polite">
                      {item.quantity}
                    </div>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => increment(item.id, item.quantity)}
                      className="px-3 py-1 text-gray-700 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50">Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky summary */}
          <div className="md:col-span-1 md:sticky md:top-20 space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-gray-700">Items</div>
                <div className="font-semibold">{itemsCount}</div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="font-semibold">Subtotal</div>
                <div className="text-xl font-bold">₹{Number(totalPrice).toFixed(0)}</div>
              </div>

              {/* Free delivery progress */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Free delivery threshold</span>
                  <span className="font-medium">₹{FREE_DELIVERY_THRESHOLD}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-brand-primary rounded-full" style={{ width: `${progress.pct}%` }}></div>
                </div>
                {progress.remaining > 0 ? (
                  <div className="text-xs text-gray-600 mt-1">Add ₹{progress.remaining.toFixed(0)} more for free delivery</div>
                ) : (
                  <div className="text-xs text-green-600 mt-1">You’ve unlocked free delivery!</div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <PressScale>
                  <button
                    onClick={clearCart}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1 transition"
                    aria-label="Clear cart"
                    title="Clear Cart"
                  >
                    <span>🧹</span>
                    <span className="font-medium">Clear Cart</span>
                  </button>
                </PressScale>
                <PressScale className="inline-block">
                  <Link to="/checkout/options" className="btn-primary">Checkout</Link>
                </PressScale>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFade>
  )
}