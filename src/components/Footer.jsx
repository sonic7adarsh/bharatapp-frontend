import React from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../hooks/useAuth'

export default function Footer() {
  const { isSeller, isAdmin } = useAuth()
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-brand-accent">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 2C8.686 2 6 4.686 6 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.314-2.686-6-6-6z" fill="currentColor" opacity="0.2"/>
                  <path d="M9 11h6a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M9 11c0-1.657 1.567-3 3.5-3S16 9.343 16 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="font-bold text-xl">CityCart</span>
            </div>
            <p className="text-gray-300">Shop your city. Support local businesses. Fast, reliable delivery.</p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Explore</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-brand-accent transition-colors">Home</Link></li>
              <li><Link to="/stores" className="text-gray-300 hover:text-brand-accent transition-colors">Stores</Link></li>
              <li><Link to="/hotels" className="text-gray-300 hover:text-brand-accent transition-colors">Hotels</Link></li>
              {(isSeller || isAdmin) && (
                <li><Link to="/onboard" className="text-gray-300 hover:text-brand-accent transition-colors">Register Your Store</Link></li>
              )}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Account</h3>
            <ul className="space-y-2">
              <li><Link to="/orders" className="text-gray-300 hover:text-brand-accent transition-colors">My Orders</Link></li>
              <li><Link to="/bookings" className="text-gray-300 hover:text-brand-accent transition-colors">My Bookings</Link></li>
              {(isSeller || isAdmin) && (
                <li><Link to="/dashboard" className="text-gray-300 hover:text-brand-accent transition-colors">Dashboard</Link></li>
              )}
              <li><Link to="/login" className="text-gray-300 hover:text-brand-accent transition-colors">Login</Link></li>
              <li><Link to="/register" className="text-gray-300 hover:text-brand-accent transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Email: <a className="hover:text-brand-accent" href="mailto:hello@citycart.app">hello@citycart.app</a></li>
              <li>Phone: <a className="hover:text-brand-accent" href="tel:+919123456789">+91 91234 56789</a></li>
            </ul>
            <div className="mt-4 flex items-center gap-3">
              <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.28 4.28 0 0 0 1.88-2.36 8.56 8.56 0 0 1-2.71 1.04 4.27 4.27 0 0 0-7.28 3.9A12.1 12.1 0 0 1 3.16 4.9a4.27 4.27 0 0 0 1.32 5.7 4.23 4.23 0 0 1-1.93-.53v.05a4.27 4.27 0 0 0 3.43 4.19 4.29 4.29 0 0 1-1.93.07 4.27 4.27 0 0 0 3.98 2.96A8.57 8.57 0 0 1 2 19.54a12.1 12.1 0 0 0 6.56 1.92c7.88 0 12.2-6.53 12.2-12.2l-.01-.56A8.72 8.72 0 0 0 22.46 6z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm6.5-.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.5 9.9v-7h-2v-2.9h2v-2.2c0-2 1.2-3.1 3-3.1.9 0 1.8.16 1.8.16v2h-1c-1 0-1.3.62-1.3 1.25v1.9h2.3L15 14.9h-2v7A10 10 0 0 0 22 12z"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CityCart — Shop Your City.</p>
          <p className="mt-2 sm:mt-0">Made for local communities. Built with ❤️.</p>
        </div>
      </div>
    </footer>
  )
}