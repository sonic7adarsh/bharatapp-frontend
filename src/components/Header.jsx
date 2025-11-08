import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'
import useAuth from '../hooks/useAuth'
import locationService from '../services/locationService'
import { useAnnouncer } from '../context/AnnouncerContext'
import { isNavKey, nextIndexForKey } from '../lib/keyboard'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation()
  const navigate = useNavigate()
  const { itemsCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const role = String(user?.role || '').toLowerCase()
  const isSeller = role === 'seller' || role === 'vendor'
  const isAdmin = role === 'admin'
  const { announce } = useAnnouncer()
  const prevCountRef = useRef(itemsCount)
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [isLocMenuOpen, setIsLocMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountTriggerRef = useRef(null)
  const accountMenuRef = useRef(null)
  const [accountActiveIndex, setAccountActiveIndex] = useState(0)

  // Handle responsive breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false)
    setIsAccountMenuOpen(false)
  }, [location.pathname])

  // Initialize city from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('user_city') || ''
      if (cached) setCity(cached)
    } catch {}
  }, [])

  // Announce cart count changes politely (skip initial mount)
  useEffect(() => {
    const prev = prevCountRef.current
    if (typeof prev === 'number' && prev !== itemsCount) {
      const msg = itemsCount === 0 ? 'Cart is now empty.' : `Cart updated, ${itemsCount} item${itemsCount === 1 ? '' : 's'}.`
      try { announce(msg, 'polite') } catch {}
    }
    prevCountRef.current = itemsCount
  }, [itemsCount, announce])

  // Close account menu on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (!isAccountMenuOpen) return
      const menu = accountMenuRef.current
      const trigger = accountTriggerRef.current
      if (menu && trigger && !menu.contains(e.target) && !trigger.contains(e.target)) {
        setIsAccountMenuOpen(false)
        try { announce('Account menu closed.', 'polite') } catch {}
        try { trigger.focus() } catch {}
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [isAccountMenuOpen, announce])

  const openAccountMenu = () => {
    setIsAccountMenuOpen(true)
    setAccountActiveIndex(0)
    try { announce('Account menu opened.', 'polite') } catch {}
    setTimeout(() => {
      const items = accountMenuRef.current?.querySelectorAll('[role="menuitem"]') || []
      const first = items[0]
      if (first && typeof first.focus === 'function') first.focus()
    }, 0)
  }

  const closeAccountMenu = (returnFocus = true) => {
    setIsAccountMenuOpen(false)
    try { announce('Account menu closed.', 'polite') } catch {}
    if (returnFocus) {
      const trigger = accountTriggerRef.current
      try { trigger?.focus() } catch {}
    }
  }

  const onAccountTriggerKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      isAccountMenuOpen ? closeAccountMenu(false) : openAccountMenu()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!isAccountMenuOpen) openAccountMenu()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeAccountMenu()
    }
  }

  const onAccountMenuKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeAccountMenu()
      return
    }
    if (isNavKey(e.key)) {
      e.preventDefault()
      const items = accountMenuRef.current?.querySelectorAll('[role="menuitem"]') || []
      const length = items.length
      const nextIdx = nextIndexForKey(accountActiveIndex, length, e.key)
      setAccountActiveIndex(nextIdx)
      const nextEl = items[nextIdx]
      if (nextEl && typeof nextEl.focus === 'function') nextEl.focus()
    }
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:text-brand-accent focus:px-3 focus:py-2 focus:rounded-md focus:shadow" aria-label="Skip to main content">Skip to main content</a>
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - responsive sizing */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="CityCart home">
            <span className="text-brand-accent">
              {/* CityCart logomark: map pin + bag */}
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6z" fill="currentColor" opacity="0.15"/>
                <path d="M9 11h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                <path d="M9 11c0-1.657 1.567-3 3.5-3S16 9.343 16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </span>
            <span className="font-bold text-lg sm:text-xl text-brand-accent hidden sm:inline">CityCart</span>
            <span className="sm:hidden font-bold text-brand-accent">CC</span>
          </Link>
          
          {/* Mobile: Cart + Menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-brand-accent touch-manipulation" aria-label={`Cart with ${itemsCount} items`} aria-current={location.pathname.startsWith('/cart') ? 'page' : undefined}>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-bold bg-brand-primary text-white rounded-full h-5 min-w-[20px] px-1" aria-live="polite">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 rounded-md touch-manipulation"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              aria-controls="primary-mobile-nav"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
          
          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6" aria-label="Primary">
            <Link to="/" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname === '/' ? 'page' : undefined}>Home</Link>
            <Link to="/stores" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/stores') ? 'page' : undefined}>Stores</Link>
            <Link to="/hotels" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/hotels') ? 'page' : undefined}>Hotels</Link>
            <Link to="/partner" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/partner') ? 'page' : undefined}>Partner with us</Link>
            {/* Location indicator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLocMenuOpen(v => !v)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border rounded-md hover:bg-gray-50"
                aria-haspopup="true"
                aria-expanded={isLocMenuOpen}
              >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-brand-accent" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-3.3-4.9-6-9-6-12a6 6 0 1112 0c0 3-2.7 7.1-6 12z" />
                  <circle cx="12" cy="9" r="2.3" />
                </svg>
                <span>{detectingCity ? 'Detecting…' : city ? city : 'Set location'}</span>
                <svg className="h-3 w-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isLocMenuOpen && (
                <div className="absolute left-0 mt-2 w-44 bg-white rounded-md shadow-lg border border-gray-100 z-50">
                  <button
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={async () => {
                      setDetectingCity(true)
                      const detected = await locationService.detectCityViaGeolocation()
                      if (detected) {
                        setCity(detected)
                        try { localStorage.setItem('user_city', detected) } catch {}
                      }
                      setDetectingCity(false)
                      setIsLocMenuOpen(false)
                    }}
                  >Use My Location</button>
                  <button
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setCity('')
                      try { localStorage.removeItem('user_city') } catch {}
                      setIsLocMenuOpen(false)
                    }}
                  >Clear Location</button>
                  <Link
                    to="/stores"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsLocMenuOpen(false)}
                  >View Stores</Link>
                </div>
              )}
            </div>
            <Link to="/cart" className="relative inline-flex items-center text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-label={`Cart with ${itemsCount} items`} aria-current={location.pathname.startsWith('/cart') ? 'page' : undefined}>
              <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden lg:inline">Cart</span>
              {itemsCount > 0 && (
                <span className="ml-1 lg:ml-2 inline-flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full h-5 min-w-[20px] px-1" aria-live="polite">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </Link>
            
            {/* Auth section */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="relative">
                    <button
                      ref={accountTriggerRef}
                      id="account-menu-trigger"
                      type="button"
                      className="flex items-center space-x-1 text-gray-700 hover:text-brand-accent font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 rounded-md"
                      aria-haspopup="menu"
                      aria-expanded={isAccountMenuOpen}
                      aria-controls="account-menu"
                      onClick={() => (isAccountMenuOpen ? closeAccountMenu(false) : openAccountMenu())}
                      onKeyDown={onAccountTriggerKeyDown}
                    >
                      <span className="hidden lg:inline">{user?.name || user?.phone || 'Account'}</span>
                      <span className="lg:hidden">👤</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isAccountMenuOpen && (
                      <div
                        ref={accountMenuRef}
                        id="account-menu"
                        role="menu"
                        aria-labelledby="account-menu-trigger"
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-100"
                        onKeyDown={onAccountMenuKeyDown}
                      >
                        {(isSeller || isAdmin) && (
                          <>
                            <Link
                              to="/dashboard"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              Dashboard
                            </Link>
                            <Link
                              to="/products/add"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              Add Product
                            </Link>
                            <Link
                              to="/seller/products"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              My Products
                            </Link>
                            <Link
                              to="/rooms/add"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              Add Room
                            </Link>
                            <Link
                              to="/seller/orders"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              Seller Orders
                            </Link>
                            <Link
                              to="/seller/bookings"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              Seller Bookings
                            </Link>
                          </>
                        )}
                        <Link
                          to="/bookings"
                          role="menuitem"
                          tabIndex={-1}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => closeAccountMenu(false)}
                        >
                          My Bookings
                        </Link>
                        <Link
                          to="/orders"
                          role="menuitem"
                          tabIndex={-1}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => closeAccountMenu(false)}
                        >
                          My Orders
                        </Link>
                        <button
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => { closeAccountMenu(false); logout() }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
              <Link to={'/mobile-login'} className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primaryDark transition-colors">Login</Link>
                </>
              )}
            </div>
          </nav>
        </div>
        
        {/* Mobile navigation - Enhanced */}
        {isMenuOpen && (
          <div className="md:hidden">
            <nav id="primary-mobile-nav" className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200" aria-label="Mobile primary">
              <Link to="/" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname === '/' ? 'page' : undefined}>
                🏠 Home
              </Link>
              {(isSeller || isAdmin) && (
                <>
                  <Link to="/dashboard" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/dashboard') ? 'page' : undefined}>
                    📊 Dashboard
                  </Link>
                  <Link to="/products/add" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/products/add') ? 'page' : undefined}>
                    ➕ Add Product
                  </Link>
                  <Link to="/seller/products" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/products') ? 'page' : undefined}>
                    📦 My Products
                  </Link>
                  <Link to="/rooms/add" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/rooms/add') ? 'page' : undefined}>
                    🛏️ Add Room
                  </Link>
                </>
              )}
              <Link to="/stores" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/stores') ? 'page' : undefined}>
                🏪 Stores
              </Link>
              <Link to="/hotels" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/hotels') ? 'page' : undefined}>
                🏨 Hotels
              </Link>
              <Link to="/partner" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/partner') ? 'page' : undefined}>
                🤝 Partner with us
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/bookings" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/bookings') ? 'page' : undefined}>
                    🛎️ My Bookings
                  </Link>
                  <Link to="/orders" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/orders') ? 'page' : undefined}>
                    📦 My Orders
                  </Link>
                  {(isSeller || isAdmin) && (
                    <>
                      <Link to="/seller/orders" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/orders') ? 'page' : undefined}>
                        🧾 Seller Orders
                      </Link>
                      <Link to="/seller/bookings" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/bookings') ? 'page' : undefined}>
                        🛎️ Seller Bookings
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Signed in as {user?.name || user?.phone || 'User'}
                    </div>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <Link to={'/mobile-login'} className="block px-3 py-3 text-base font-medium text-white bg-brand-primary hover:bg-brand-primaryDark rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/mobile-login') ? 'page' : undefined}>
                    🔑 Login
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
