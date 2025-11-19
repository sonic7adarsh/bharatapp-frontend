import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import useAuth from '../hooks/useAuth'
import { PageFade, PressScale } from '../motion/presets'
import { useAnnouncer } from '../context/AnnouncerContext'
import eventService from '../services/eventService'

export default function MyBookings() {
  const { user, loading: authLoading } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(null)
  const navigate = useNavigate()
  const { announce } = useAnnouncer()

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true)
        announce('Loading bookings…', 'polite')
        try { eventService.track('page_view', { page: '/bookings', title: 'MyBookings' }) } catch {}
        try { eventService.track('bookings_fetch_start', { source: 'my_bookings', userId: user?.id, page, pageSize }) } catch {}
        const data = await orderService.getBookings({ page, limit: pageSize })
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.bookings)
              ? data.bookings
              : []
        const t = (typeof data?.total === 'number'
          ? data.total
          : typeof data?.count === 'number'
            ? data.count
            : (data?.pagination?.total ?? null))
        setTotal(typeof t === 'number' ? t : null)
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
        const pageText = typeof total === 'number' ? `Page ${page} of ${Math.max(1, Math.ceil(total / pageSize))}` : `Page ${page}`
        announce(normalized.length > 0 ? `Loaded ${normalized.length} bookings. ${pageText}` : 'No room bookings yet.', 'polite')
        try { eventService.track('bookings_fetch_success', { source: 'my_bookings', count: normalized.length, total, page, pageSize }) } catch {}
        if (normalized.length === 0) {
          try { eventService.track('bookings_empty', { source: 'my_bookings' }) } catch {}
        }
      } catch (err) {
        console.error('Failed to fetch bookings:', err)
        setError(err?.response?.data?.message || 'Failed to load bookings. Please try again later.')
        announce('Failed to load bookings. Please try again later.', 'assertive')
        try {
          eventService.track('bookings_fetch_error', {
            source: 'my_bookings',
            message: err?.response?.data?.message || err?.message || 'Unknown error',
            code: err?.response?.status
          })
        } catch {}
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [user?.id, page, pageSize])

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
        <>
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
                      <Link to={`/bookings/${encodeURIComponent(b.id || b.reference || '')}`} id={titleId} className="text-indigo-600 hover:text-indigo-800" aria-label={`Booking ${b.reference || b.id || ''} on ${dateStr}`} onClick={() => { try { eventService.track('booking_click', { id: b.id || b.reference, source: 'my_bookings_title' }) } catch {} }}>
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
                      <Link to={`/bookings/${encodeURIComponent(b.id || b.reference || '')}`} className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={() => { try { eventService.track('booking_click', { id: b.id || b.reference, source: 'my_bookings_button' }) } catch {} }}>View Details</Link>
                    </PressScale>
                    {(b.store?.id || b.storeId || b.room?.storeId) ? (
                      <PressScale className="inline-block">
                        <Link to={`/hotels/${encodeURIComponent(b.store?.id || b.storeId || b.room?.storeId)}`} className="px-3 py-2 rounded-md border hover:bg-gray-50" onClick={() => { try { eventService.track('nav_click', { target: `/hotels/${encodeURIComponent(b.store?.id || b.storeId || b.room?.storeId)}`, context: 'my_bookings' }) } catch {} }}>View Hotel</Link>
                      </PressScale>
                    ) : null}
                    <PressScale className="inline-block">
                      <button onClick={() => { try { eventService.track('nav_click', { target: '/hotels', context: 'my_bookings' }) } catch {} ; navigate('/hotels') }} className="px-3 py-2 rounded-md border hover:bg-gray-50">Explore more</button>
                    </PressScale>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">Showing {bookings.length} result(s){typeof total === 'number' ? ` of ${total}` : ''}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >Prev</button>
            <div className="text-sm">Page {page}{typeof total === 'number' ? ` of ${Math.max(1, Math.ceil(total / pageSize))}` : ''}</div>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="px-2 py-1 border rounded"
              aria-label="Items per page"
            >
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <button
              className="px-3 py-1.5 rounded border border-gray-300 disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={typeof total === 'number' ? page >= Math.max(1, Math.ceil(total / pageSize)) : bookings.length < pageSize}
            >Next</button>
          </div>
        </div>
        </>
      )}
    </PageFade>
  )
}