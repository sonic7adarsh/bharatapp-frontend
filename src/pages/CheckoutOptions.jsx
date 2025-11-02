import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'

export default function CheckoutOptions() {
  const navigate = useNavigate()
  const { items, totalPrice } = useCart()
  const [method, setMethod] = useState('cod')

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/cart')
    }
  }, [items, navigate])

  const continueCheckout = () => {
    // Persist choice lightly and navigate with query param
    try { localStorage.setItem('checkout_method', method) } catch {}
    navigate(`/checkout?method=${encodeURIComponent(method)}`)
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold">Choose Payment Method</h2>
      <p className="text-gray-600 mt-1">Tap an icon to choose how you want to pay.</p>

      <div className="mt-4 space-y-4">
        {/* Icon-only selection tiles */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMethod('cod')}
            aria-label="Cash on Delivery"
            className={`bg-white rounded-lg shadow-sm p-6 flex items-center justify-center hover:ring-2 hover:ring-indigo-300 transition ${method === 'cod' ? 'ring-2 ring-indigo-500' : ''}`}
          >
            <span className="text-5xl" aria-hidden>💵</span>
            <span className="sr-only">Cash on Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('online')}
            aria-label="Online Payment (Card/UPI)"
            className={`bg-white rounded-lg shadow-sm p-6 flex items-center justify-center hover:ring-2 hover:ring-indigo-300 transition ${method === 'online' ? 'ring-2 ring-indigo-500' : ''}`}
          >
            <span className="text-5xl" aria-hidden>💳</span>
            <span className="text-4xl ml-2" aria-hidden>📱</span>
            <span className="sr-only">Online Payment (Card/UPI)</span>
          </button>
        </div>

        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-md p-4">
          <div className="font-semibold">Cart Total</div>
          <div className="text-xl font-bold">₹{Number(totalPrice).toFixed(2)}</div>
        </div>

        <div className="flex justify-end">
          <button onClick={continueCheckout} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
            Continue to Checkout
          </button>
        </div>
      </div>
    </main>
  )
}