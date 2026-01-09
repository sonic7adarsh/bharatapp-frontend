import React, { useState, useEffect, useRef } from 'react'
import Header from './Header'
import Footer from './Footer'
import FloatingCartButton from './FloatingCartButton'
import ErrorBoundary from './ErrorBoundary'
import { useLocation } from 'react-router-dom'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function Layout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const mainRef = useRef(null)
  const location = useLocation()
  const { announce } = useAnnouncer()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // On route change, focus the main content and announce page title
  useEffect(() => {
    try {
      const el = mainRef.current || document.getElementById('main-content')
      el?.focus()
      const title = document.title || 'Page loaded'
      announce(`Page loaded: ${title}`, 'polite')
    } catch {}
  }, [location.pathname, announce])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main ref={mainRef} id="main-content" role="main" tabIndex={-1} className={`flex-grow transition-all duration-300 ${isScrolled ? 'pt-2' : 'pt-0'}`}>
        <div className="min-h-full">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
      <FloatingCartButton />
      
      <Footer />
    </div>
  )
}