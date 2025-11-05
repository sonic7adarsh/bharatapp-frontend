import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import useCart from '../context/CartContext'
import useAuth from '../hooks/useAuth'
import locationService from '../services/locationService'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation()
  const navigate = useNavigate()
  const { itemsCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const [city, setCity] = useState('')
  const [detectingCity, setDetectingCity] = useState(false)
  const [isLocMenuOpen, setIsLocMenuOpen] = useState(false)

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
  }, [location.pathname])

  // Initialize city from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('user_city') || ''
      if (cached) setCity(cached)
    } catch {}
  }, [])

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - responsive sizing */}
          <Link to="/" className="font-bold text-lg sm:text-xl text-brand-accent flex-shrink-0">
            <span className="hidden sm:inline">Bharat · Local</span>
            <span className="sm:hidden">BL</span>
          </Link>
          
          {/* Mobile: Cart + Menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-brand-accent touch-manipulation">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center text-xs font-bold bg-brand-primary text-white rounded-full h-5 min-w-[20px] px-1">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </Link>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 rounded-md touch-manipulation"
              aria-label="Toggle menu"
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
          <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link to="/" className="text-gray-700 hover:text-brand-accent font-medium transition-colors">Home</Link>
            <Link to="/stores" className="text-gray-700 hover:text-brand-accent font-medium transition-colors">Stores</Link>
            <Link to="/hotels" className="text-gray-700 hover:text-brand-accent font-medium transition-colors">Hotels</Link>
            {/* Location indicator */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLocMenuOpen(v => !v)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 border rounded-md hover:bg-gray-50"
                aria-haspopup="true"
                aria-expanded={isLocMenuOpen}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-brand-accent" aria-hidden>
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
            <Link to="/cart" className="relative inline-flex items-center text-gray-700 hover:text-brand-accent font-medium transition-colors">
              <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="hidden lg:inline">Cart</span>
              {itemsCount > 0 && (
                <span className="ml-1 lg:ml-2 inline-flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full h-5 min-w-[20px] px-1">
                  {itemsCount > 99 ? '99+' : itemsCount}
                </span>
              )}
            </Link>
            
            {/* Auth section */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <Link to="/orders" className="text-gray-700 hover:text-brand-accent font-medium transition-colors">Orders</Link>
                  <div className="relative group">
                    <button className="flex items-center space-x-1 text-gray-700 hover:text-brand-accent font-medium transition-colors">
                      <span className="hidden lg:inline">{user?.name || user?.phone || 'Account'}</span>
                      <span className="lg:hidden">👤</span>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Dashboard</Link>
                      <Link to="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</Link>
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Logout</button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="px-3 lg:px-4 py-2 text-sm font-medium link-brand">Login</Link>
                  <Link to="/register" className="px-3 lg:px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primaryDark transition-colors">Register</Link>
                </>
              )}
            </div>
          </nav>
        </div>
        
        {/* Mobile navigation - Enhanced */}
        {isMenuOpen && (
          <div className="md:hidden">
            <nav className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
              <Link to="/" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                🏠 Home
              </Link>
              <Link to="/stores" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                🏪 Stores
              </Link>
              <Link to="/hotels" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                🏨 Hotels
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link to="/orders" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                    📦 My Orders
                  </Link>
                  <Link to="/dashboard" className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-brand-accent hover:bg-gray-50 rounded-md transition-colors touch-manipulation">
                    📊 Dashboard
                  </Link>
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
                  <Link to="/login" className="block px-3 py-3 text-base font-medium link-brand hover:bg-brand-muted rounded-md transition-colors touch-manipulation">
                    🔑 Login
                  </Link>
                  <Link to="/register" className="block px-3 py-3 text-base font-medium text-white bg-brand-primary hover:bg-brand-primaryDark rounded-md transition-colors touch-manipulation">
                    ✨ Register
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
