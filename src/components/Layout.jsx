import React, { useState, useEffect } from 'react'
import Header from './Header'
import Footer from './Footer'
import FloatingCartButton from './FloatingCartButton'
import ErrorBoundary from './ErrorBoundary'

export default function Layout({ children }) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className={`flex-grow transition-all duration-300 ${isScrolled ? 'pt-2' : 'pt-0'}`}>
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