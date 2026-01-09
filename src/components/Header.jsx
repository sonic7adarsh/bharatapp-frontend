import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'
import useAuth from '../hooks/useAuth'
import locationService from '../services/locationService'
import { useAnnouncer } from '../context/AnnouncerContext'
import { isNavKey, nextIndexForKey } from '../lib/keyboard'
import sellerService from '../services/sellerService'
import eventService from '../services/eventService'
import { useI18n } from '../context/I18nContext'

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
  const [stores, setStores] = useState([])
  const [allowRooms, setAllowRooms] = useState(false)
  const [isLangModalOpen, setIsLangModalOpen] = useState(false)
  const { t, locale, availableLocales, setLocale } = useI18n() || { t: (k, f) => f, locale: 'en', availableLocales: [], setLocale: () => {} }
  // Prefer phone over synthetic usernames like "user1234" for display labels
  const syntheticName = typeof user?.name === 'string' && /^user\d+$/i.test(user.name)
  const displayLabel = syntheticName ? (user?.phone || t('nav.account', 'Account')) : (user?.name || user?.phone || t('nav.account', 'Account'))

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

  // Load seller stores to determine hospitality capability for Add Room and Bookings
  useEffect(() => {
    let cancelled = false
    async function loadStores() {
      if (!(isSeller || isAdmin)) {
        setStores([])
        setAllowRooms(false)
        return
      }
      try {
        const data = await sellerService.getSellerStores()
        if (cancelled) return
        const list = Array.isArray(data) ? data : []
        setStores(list)
        const isHospitality = list.some(s => {
          const cat = String(s?.category || s?.type || '').toLowerCase()
          return cat.includes('hotel') || cat.includes('hospitality') || cat.includes('residency')
        })
        const hasBookingsCapability = list.some(s => s?.capabilities?.bookings === true)
        setAllowRooms(isHospitality || hasBookingsCapability)
      } catch {
        if (cancelled) return
        setStores([])
        setAllowRooms(false)
      }
    }
    loadStores()
    return () => { cancelled = true }
  }, [isSeller, isAdmin])

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
              type="button"
              onClick={() => { 
                setIsLangModalOpen(true); 
                try { eventService.track('nav_click', { target: 'language_modal', context: 'mobile_topbar' }) } catch {}
              }}
              className="p-3 min-w-[44px] min-h-[44px] text-gray-700 hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-md touch-manipulation"
              aria-label={t('nav.language', 'Language')}
            >
              <span aria-hidden>🌐</span>
            </button>
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
            <Link to="/" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname === '/' ? 'page' : undefined}>{t('nav.home', 'Home')}</Link>
            <Link to="/stores" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/stores') ? 'page' : undefined}>{t('nav.stores', 'Stores')}</Link>
            <Link to="/hotels" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/hotels') ? 'page' : undefined}>{t('nav.hotels', 'Hotels')}</Link>
            <Link to="/partner" className="text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-current={location.pathname.startsWith('/partner') ? 'page' : undefined}>{t('nav.partner', 'Partner with us')}</Link>
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
                <span>{detectingCity ? t('nav.detecting', 'Detecting…') : city ? city : t('nav.set_location', 'Set location')}</span>
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
                  >{t('nav.use_my_location', 'Use My Location')}</button>
                  <button
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => {
                      setCity('')
                      try { localStorage.removeItem('user_city') } catch {}
                      setIsLocMenuOpen(false)
                    }}
                  >{t('nav.clear_location', 'Clear Location')}</button>
                  <Link
                    to="/stores"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsLocMenuOpen(false)}
                  >{t('nav.view_stores', 'View Stores')}</Link>
                </div>
              )}
            </div>
            <Link to="/cart" className="relative inline-flex items-center text-gray-700 hover:text-brand-accent font-medium transition-colors" aria-label={`Cart with ${itemsCount} items`} aria-current={location.pathname.startsWith('/cart') ? 'page' : undefined}>
              <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden lg:inline">{t('nav.cart', 'Cart')}</span>
              {itemsCount > 0 && (
                <span className="ml-1 lg:ml-2 inline-flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full h-5 min-w-[20px] px-1" aria-live="polite">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </Link>
            
            {/* Auth section */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Always-visible language trigger */}
              <button
                type="button"
                onClick={() => { 
                  setIsLangModalOpen(true); 
                  try { eventService.track('nav_click', { target: 'language_modal', context: 'desktop_topbar' }) } catch {}
                }}
                className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                aria-haspopup="dialog"
                aria-expanded={isLangModalOpen ? 'true' : 'false'}
              >
                <span aria-hidden>🌐</span>
                <span className="hidden lg:inline">{t('nav.language', 'Language')}</span>
                <span className="text-[11px] text-gray-500">{locale?.toUpperCase()}</span>
              </button>
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
                      <span className="hidden lg:inline">{displayLabel}</span>
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
                              {t('nav.dashboard', 'Dashboard')}
                            </Link>
                            <Link
                              to="/products/add"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              {t('nav.add_product', 'Add Product')}
                            </Link>
                            <Link
                              to="/seller/products"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              {t('nav.my_products', 'My Products')}
                            </Link>
                            {allowRooms && (
                              <Link
                                to="/rooms/add"
                                role="menuitem"
                                tabIndex={-1}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                onClick={() => { eventService.track('nav_click', { target: '/rooms/add', context: 'account_dropdown' }); closeAccountMenu(false) }}
                              >
                                {t('nav.add_room', 'Add Room')}
                              </Link>
                            )}
                            <Link
                              to="/seller/orders"
                              role="menuitem"
                              tabIndex={-1}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              onClick={() => closeAccountMenu(false)}
                            >
                              {t('nav.seller_orders', 'Seller Orders')}
                            </Link>
                            {allowRooms && (
                              <Link
                                to="/seller/bookings"
                                role="menuitem"
                                tabIndex={-1}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                onClick={() => { eventService.track('nav_click', { target: '/seller/bookings', context: 'account_dropdown' }); closeAccountMenu(false) }}
                              >
                                {t('nav.seller_bookings', 'Seller Bookings')}
                              </Link>
                            )}
                          </>
                        )}
                        <Link
                          to="/bookings"
                          role="menuitem"
                          tabIndex={-1}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => { try { eventService.track('nav_click', { target: '/bookings', context: 'account_dropdown' }) } catch {}; closeAccountMenu(false) }}
                        >
                          {t('nav.my_bookings', 'My Bookings')}
                        </Link>
                        <Link
                          to="/orders"
                          role="menuitem"
                          tabIndex={-1}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                          onClick={() => closeAccountMenu(false)}
                        >
                          {t('nav.my_orders', 'My Orders')}
                        </Link>
                        <button
                          role="menuitem"
                          tabIndex={-1}
                          onClick={() => { closeAccountMenu(false); logout({ to: '/' }) }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        >
                          {t('nav.logout', 'Logout')}
                        </button>
                        {/* Language selection moved to top bar globe — removed from account menu */}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
              <Link to={'/mobile-login'} className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primaryDark transition-colors">{t('nav.login', 'Login')}</Link>
              <Link to={'/seller-register'} className="px-3 lg:px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-md hover:bg-brand-primary hover:text-white transition-colors">{t('nav.register_seller', 'Register as Seller')}</Link>
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
                🏠 {t('nav.home', 'Home')}
              </Link>
              {(isSeller || isAdmin) && (
                <>
                  <Link to="/dashboard" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/dashboard') ? 'page' : undefined}>
                    📊 {t('nav.dashboard', 'Dashboard')}
                  </Link>
                  <Link to="/products/add" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/products/add') ? 'page' : undefined}>
                    ➕ {t('nav.add_product', 'Add Product')}
                  </Link>
                  <Link to="/seller/products" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/products') ? 'page' : undefined}>
                    📦 {t('nav.my_products', 'My Products')}
                  </Link>
                  {allowRooms && (
                    <Link to="/rooms/add" onClick={() => eventService.track('nav_click', { target: '/rooms/add', context: 'mobile_nav' })} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/rooms/add') ? 'page' : undefined}>
                      🛏️ {t('nav.add_room', 'Add Room')}
                    </Link>
                  )}
                </>
              )}
              <Link to="/stores" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/stores') ? 'page' : undefined}>
                🏪 {t('nav.stores', 'Stores')}
              </Link>
              <Link to="/hotels" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/hotels') ? 'page' : undefined}>
                🏨 {t('nav.hotels', 'Hotels')}
              </Link>
              <Link to="/partner" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/partner') ? 'page' : undefined}>
                🤝 {t('nav.partner', 'Partner with us')}
              </Link>
              {/* Language selection moved to mobile top bar globe — removed from mobile nav list */}
              
              {isAuthenticated ? (
                <>
                  <Link to="/bookings" onClick={() => { try { eventService.track('nav_click', { target: '/bookings', context: 'mobile_nav' }) } catch {} }} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/bookings') ? 'page' : undefined}>
                    🛎️ {t('nav.my_bookings', 'My Bookings')}
                  </Link>
                  <Link to="/orders" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/orders') ? 'page' : undefined}>
                    📦 {t('nav.my_orders', 'My Orders')}
                  </Link>
                  {(isSeller || isAdmin) && (
                    <>
                      <Link to="/seller/orders" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/orders') ? 'page' : undefined}>
                        🧾 {t('nav.seller_orders', 'Seller Orders')}
                      </Link>
                      {allowRooms && (
                        <Link to="/seller/bookings" onClick={() => eventService.track('nav_click', { target: '/seller/bookings', context: 'mobile_nav' })} className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller/bookings') ? 'page' : undefined}>
                          🛎️ {t('nav.seller_bookings', 'Seller Bookings')}
                        </Link>
                      )}
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {t('nav.signed_in_as', 'Signed in as')} {displayLabel}
                    </div>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-3 py-3 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                    >
                      🚪 {t('nav.logout', 'Logout')}
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <Link to={'/mobile-login'} className="block px-3 py-3 text-base font-medium text-white bg-brand-primary hover:bg-brand-primaryDark rounded-md transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/mobile-login') ? 'page' : undefined}>
                    🔑 {t('nav.login', 'Login')}
                  </Link>
                  <Link to={'/seller-register'} className="block px-3 py-3 text-base font-medium text-brand-primary border border-brand-primary rounded-md hover:bg-brand-primary hover:text-white transition-colors touch-manipulation" aria-current={location.pathname.startsWith('/seller-register') ? 'page' : undefined}>
                    🏪 {t('nav.register_seller', 'Register as Seller')}
                  </Link>
        </div>
      )}

            </nav>
          </div>
        )}
      </div>
    {/* Global language selection modal (outside mobile nav) */}
    {isLangModalOpen && (
      <div className="fixed inset-0 z-[2000]" aria-modal="true" role="dialog" aria-label={t('nav.language_select_title', 'Choose Language')}>
        <div className="absolute inset-0 bg-black/40" onClick={() => setIsLangModalOpen(false)} aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2"><span aria-hidden>🌐</span>{t('nav.language_select_title', 'Choose Language')}</h2>
              <button type="button" onClick={() => setIsLangModalOpen(false)} className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-accent rounded px-2 py-1" aria-label={t('common.close', 'Close')}>✖</button>
            </div>
            <div className="max-h-[70vh] sm:max-h-64 overflow-y-auto">
              {availableLocales.length > 0 ? (
                availableLocales.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => { 
                      setLocale(l.code); 
                      setIsLangModalOpen(false); 
                      try { eventService.track('language_change', { locale: l.code, ui: 'modal' }) } catch {}
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${locale === l.code ? 'bg-brand-accent/10 text-brand-primary' : 'hover:bg-gray-50 text-gray-800'}`}
                  >
                    <span className="flex items-center justify-between">
                      <span>{l.name || l.code}</span>
                      {locale === l.code && <span aria-hidden>✔</span>}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-600">{t('nav.language_no_options', 'No languages available')}</div>
              )}
            </div>
            <div className="px-4 py-3 border-t flex justify-end">
              <button type="button" onClick={() => setIsLangModalOpen(false)} className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent">{t('common.close', 'Close')}</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </header>
  )
}
