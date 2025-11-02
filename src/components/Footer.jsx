import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">BharatApp</h3>
            <p className="text-gray-300">Connecting local businesses with customers across India.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-white">Home</Link></li>
              <li><Link to="/stores" className="text-gray-300 hover:text-white">Stores</Link></li>
              <li><Link to="/onboard" className="text-gray-300 hover:text-white">Register Your Store</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <p className="text-gray-300">Email: contact@bharatapp.com</p>
            <p className="text-gray-300">Phone: +91 1234567890</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} BharatApp. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}