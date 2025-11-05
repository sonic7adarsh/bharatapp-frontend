import React from 'react'
import useCart from '../context/CartContext'
import { Link } from 'react-router-dom'
import { PageFade, PressScale } from '../motion/presets'

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

  return (
    <PageFade className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Your Cart</h2>
      {items.length === 0 ? (
        <div className="mt-4 bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-md">
          <p>Your cart is empty.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-600">₹{item.price} each</div>
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
                  <div className="px-4 py-1 min-w-[2.5rem] text-center font-medium">
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
                <button onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-700">Remove</button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between bg-brand-muted border border-orange-100 rounded-md p-4">
            <div className="font-semibold">Total</div>
            <div className="text-xl font-bold">₹{totalPrice.toFixed(2)}</div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={clearCart} className="text-gray-600 hover:text-gray-800">Clear Cart</button>
            <PressScale className="inline-block">
              <Link to="/checkout/options" className="btn-primary">Checkout</Link>
            </PressScale>
          </div>
        </div>
      )}
    </PageFade>
  )
}