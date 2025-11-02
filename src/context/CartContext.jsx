import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import cartService from '../services/cartService'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items))
    } catch (e) {
      // ignore storage errors
    }
  }, [items])

  // Attempt to sync with backend cart on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const data = await cartService.getCart()
        const backendItems = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
        if (backendItems.length > 0) {
          setItems(backendItems.map(i => ({
            id: i.id,
            name: i.name,
            price: Number(i.price) || 0,
            quantity: Number(i.quantity) || 1,
          })))
        }
      } catch (e) {
        // silently ignore if unauthorized or backend not available
      }
    }
    loadCart()
  }, [])

  const addItem = async (product, qty = 1) => {
    if (!product?.id) return
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + qty } : i)
      }
      return [...prev, { id: product.id, name: product.name, price: product.price || 0, quantity: qty }]
    })
    try {
      await cartService.addToCart({ id: product.id, name: product.name, price: product.price || 0, quantity: qty })
    } catch (e) {
      // ignore backend errors for add
    }
  }

  const removeItem = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id))
    try {
      await cartService.removeFromCart(id)
    } catch (e) {
      // ignore backend errors for remove
    }
  }

  const updateItemQuantity = async (id, qty) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter(i => i.id !== id)
      return prev.map(i => i.id === id ? { ...i, quantity: qty } : i)
    })
    try {
      if (qty <= 0) {
        await cartService.removeFromCart(id)
      } else {
        const item = items.find(i => i.id === id)
        if (item) {
          await cartService.addToCart({ id, name: item.name, price: item.price, quantity: qty })
        }
      }
    } catch (e) {
      // ignore backend errors for update
    }
  }

  const clearCart = () => setItems([])

  const totals = useMemo(() => {
    const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return { itemsCount, totalPrice }
  }, [items])

  const value = {
    items,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    itemsCount: totals.itemsCount,
    totalPrice: totals.totalPrice,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export default function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}