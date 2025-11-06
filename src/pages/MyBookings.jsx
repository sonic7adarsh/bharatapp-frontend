import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { announce } = useAnnouncer()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        announce('Loading bookings…', 'polite')
        const data = await orderService.getBookings()
        const list = Array.isArray(data) ? data : Array.isArray(data?.bookings) ? data.bookings : []
        // Normalize data structure
        const normalized = list.map(b => ({
          id: b.id || b.reference || String(Date.now()),
          reference: b.reference || b.id || '',
          createdAt: b.createdAt || b.date || new Date().toISOString(),
          store: b.store || {},
          room: b.room || {},
          booking: b.booking || {},
          guest: b.guest || {},
          totals: b.totals || { payable: b.total || 0 },
          status: b.status || 'confirmed',
        }))
        setBookings(normalized)
        setError('')
        announce(normalized.length > 0 ? `Loaded ${normalized.length} bookings.` : 'No room bookings yet.', 'polite')
      } catch (err) {
        console.error('Failed to fetch bookings:', err)
        setError(err?.response?.data?.message || 'Failed to load bookings. Please try again later.')
        announce('Failed to load bookings. Please try again later.', 'assertive')
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user?.id])

  if (authLoading || loading) {
    return (
      <PageFade className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" aria-hidden="true"></div>
          <span className="sr-only">Loading bookings…</span>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 id="bookings-heading" className="text-2xl font-bold">My Room Bookings</h1>
        <div className="flex items-center gap-2">
          <PressScale className="inline-block">
            <Link to="/hotels" className="inline-flex items-center px-3 py-2 rounded-md border border-brand-primary text-brand-primary hover:bg-orange-50">Browse Hotels</Link>
          </PressScale>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <section className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md" aria-labelledby="empty-bookings-title">
          <p id="empty-bookings-title" className="font-medium">No room bookings yet.</p>
          <p className="text-sm mt-1">Explore hotels and book your next stay.</p>
          <div className="mt-3">
            <Link to="/hotels" className="link-brand font-medium">Browse Hotels</Link>
          </div>
        </section>
      ) : (
        <ul role="list" aria-labelledby="bookings-heading" className="space-y-4">
          {bookings.map((b, idx) => {
            const dateStr = (() => {
              const d = b.createdAt || b.date
              const dt = d ? new Date(d) : null
              return dt ? dt.toLocaleString() : 'Unknown date'
            })()
            const titleId = `booking-${String(b.id || b.reference || idx)}-title`
            const descId = `booking-${String(b.id || b.reference || idx)}-desc`
            const nights = Number(b.booking?.nights || 1)
            const payable = Number(b.totals?.payable || b.total || 0)
            return (
              <li key={b.id || b.reference || idx} className="bg-white p-4 rounded-lg shadow-sm" aria-labelledby={titleId} aria-describedby={descId}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      <Link to={`/bookings/${encodeURIComponent(b.id || b.reference || '')}`} id={titleId} className="text-indigo-600 hover:text-indigo-800" aria-label={`Booking ${b.reference || b.id || ''} on ${dateStr}`}>
                        Booking {b.reference || b.id || ''}
                      </Link>
                    </div>
                    <div id={descId} className="mt-1 text-xs text-gray-600">
                      <span>📍 {b.store?.name || 'Hotel'}</span>
                      {b.room?.name ? <span className="ml-2">• 🛏️ {b.room.name}</span> : null}
                      <span className="ml-2">• 📅 {b.booking?.checkIn} → {b.booking?.checkOut}</span>
                      <span className="ml-2">• 🌙 {nights} night{nights > 1 ? 's' : ''}</span>
                      <span className="ml-2">• 👤 {Number(b.booking?.guests || 1)} guest{Number(b.booking?.guests || 1) > 1 ? 's' : ''}</span>
                      {payable ? <span className="ml-2">• ₹{payable.toFixed(2)}</span> : null}
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium min-w-[96px] ${String(b.status).toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {String(b.status || 'confirmed').toUpperCase()}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Booked on {dateStr}</div>
                  <div className="flex items-center gap-2">
                    <PressScale className="inline-block">
                      <Link to={`/bookings/${encodeURIComponent(b.id || b.reference || '')}`} className="px-3 py-2 rounded-md border hover:bg-gray-50">View Details</Link>
                    </PressScale>
                    <PressScale className="inline-block">
                      <Link to={`/store/${encodeURIComponent(b.store?.id || '')}`} className="px-3 py-2 rounded-md border hover:bg-gray-50">View Hotel</Link>
                    </PressScale>
                    <PressScale className="inline-block">
                      <button onClick={() => navigate('/hotels')} className="px-3 py-2 rounded-md border hover:bg-gray-50">Explore more</button>
                    </PressScale>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </PageFade>
  )
}