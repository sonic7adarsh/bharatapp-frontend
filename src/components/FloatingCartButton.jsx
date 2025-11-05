import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import useCart from '../context/CartContext'
import CartDrawer from './CartDrawer'

export default function FloatingCartButton() {
  const { itemsCount, totalPrice } = useCart()
  const location = useLocation()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [open, setOpen] = useState(false)

  // Determine hidden state first (do NOT early-return before hooks)
  const hiddenByRoute = location.pathname.startsWith('/cart') || location.pathname.startsWith('/checkout')
  const hiddenByEmpty = itemsCount === 0
  const isHidden = hiddenByRoute || hiddenByEmpty

  useEffect(() => {
    if (isHidden) return

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false) // Scrolling down
      } else {
        setIsVisible(true) // Scrolling up
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY, isHidden])

  // Now early-return based on hidden state
  if (isHidden) {
    return null
  }

  return (
    <>
      <div className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
      }`}>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center space-x-2 md:space-x-3 rounded-full shadow-xl bg-brand-primary text-white px-3 py-2 md:px-4 md:py-3 hover:bg-brand-primaryDark active:scale-95 transition-all duration-200 touch-manipulation"
          aria-label={`Open cart with ${itemsCount} items`}
        >
        <div className="relative">
          <svg className="h-5 w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8" />
          </svg>
          <span className="absolute -top-2 -right-2 inline-flex items-center justify-center bg-brand-primary text-white font-bold rounded-full h-5 min-w-[20px] px-1 text-xs">
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        </div>
        
        {/* Desktop text */}
        <div className="hidden sm:flex items-center space-x-2">
          <span className="font-semibold text-sm md:text-base">Cart</span>
          <span className="opacity-90 text-sm">₹{totalPrice.toFixed(0)}</span>
        </div>
        
        {/* Mobile text */}
        <div className="sm:hidden">
          <span className="font-semibold text-sm">₹{totalPrice.toFixed(0)}</span>
        </div>
        </button>
      </div>

      <CartDrawer isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}