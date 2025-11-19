import React, { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import orderService from '../services/orderService'
import { PageFade, PressScale } from '../motion/presets'
import { toast } from 'react-toastify'
import { useAnnouncer } from '../context/AnnouncerContext'

export default function BookingDetail() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { announce } = useAnnouncer()

  useEffect(() => {
    let active = true
    const fetchBooking = async () => {
      setLoading(true)
      setError('')
      try {
        let found = null
        if (bookingId === 'latest') {
          const data = await orderService.getBookings()
          const bookings = Array.isArray(data) ? data : Array.isArray(data?.bookings) ? data.bookings : []
          if (bookings.length > 0) found = bookings[0]
        } else {
          found = await orderService.getBookingById(bookingId)
          if (!found) {
            const data = await orderService.getBookings()
            const bookings = Array.isArray(data) ? data : Array.isArray(data?.bookings) ? data.bookings : []
            found = bookings.find(b => String(b.reference || '').toLowerCase() === String(bookingId).toLowerCase()) || null
          }
        }
        if (!active) return
        if (found) setBooking(found)
        else setError('Booking not found')
      } catch (e) {
        if (!active) return
        console.error('Failed to load booking:', e)
        setError('Failed to load booking. Please try again later.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchBooking()
    return () => { active = false }
  }, [bookingId])

  const dateStr = useMemo(() => {
    try {
      const d = booking?.createdAt || booking?.date
      return d ? new Date(d).toLocaleString() : ''
    } catch {
      return ''
    }
  }, [booking])

  const handleCopyReference = () => {
    try {
      const ref = booking?.reference || booking?.id || ''
      navigator.clipboard.writeText(String(ref))
      toast.success('Booking reference copied')
    } catch {
      toast.error('Unable to copy reference')
    }
  }

  // Rely on backend-provided store/room metadata
  const storeInfo = booking?.store || null
  const roomInfo = booking?.room || null

  useEffect(() => {
    if (!loading && booking) {
      try {
        announce('Booking details loaded.', 'polite')
      } catch {}
    }
  }, [loading, booking, announce])

  const fmtInr = (v) => {
    const num = Number(v || 0)
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  }

  // Robust per-night fallback so price never shows 0
  const perNightDisplay = useMemo(() => {
    try {
      const tpn = Number(booking?.totals?.perNight)
      if (Number.isFinite(tpn) && tpn > 0) return tpn
      const rp = Number(booking?.room?.price)
      if (Number.isFinite(rp) && rp > 0) return rp
      const nights = Number(booking?.totals?.nights || booking?.booking?.nights)
      const sub = Number(booking?.totals?.subtotal)
      if (Number.isFinite(sub) && sub > 0 && Number.isFinite(nights) && nights > 0) {
        return Math.round(sub / nights)
      }
      const pay = Number(booking?.totals?.payable)
      if (Number.isFinite(pay) && pay > 0 && Number.isFinite(nights) && nights > 0) {
        return Math.round(pay / nights)
      }
      const tot = Number(booking?.total)
      if (Number.isFinite(tot) && tot > 0 && Number.isFinite(nights) && nights > 0) {
        return Math.round(tot / nights)
      }
      return 0
    } catch { return 0 }
  }, [booking])

  if (loading) {
    return (
      <PageFade className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </PageFade>
    )
  }

  return (
    <PageFade className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
        <div className="flex items-start gap-3">
          {roomInfo?.image ? (
            <img src={roomInfo.image} alt={booking?.room?.name || 'Room'} className="w-20 h-20 rounded-md object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="w-20 h-20 rounded-md bg-gray-100 flex items-center justify-center text-gray-400">🛏️</div>
          )}
          <div>
            <h2 className="text-2xl font-bold">{booking?.room?.name || 'Room Booking'}</h2>
            <div className="mt-1 text-sm text-gray-600">{storeInfo?.name || 'Hotel'}{storeInfo?.area ? ` • ${storeInfo.area}` : ''}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">🔖 {booking?.reference || booking?.id || ''}</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-gray-700 ${String(booking?.status).toLowerCase() === 'cancelled' ? 'bg-red-100' : 'bg-green-100'}`}>{String(booking?.status || 'confirmed').toUpperCase()}</span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📅 {dateStr}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2">
          <PressScale className="inline-block">
            <button onClick={handleCopyReference} className="px-3 py-2 rounded-md border hover:bg-gray-50">Copy reference</button>
          </PressScale>
          <PressScale className="inline-block">
            <Link to="/bookings" className="inline-flex items-center px-3 py-2 rounded-md border hover:bg-gray-50">Back to Bookings</Link>
          </PressScale>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4" role="alert">
          {error}
        </div>
      )}

      {!booking ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">Unable to display booking.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Stay Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-700">Check-in</div>
                  <div className="font-medium">{booking.booking?.checkIn}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-700">Check-out</div>
                  <div className="font-medium">{booking.booking?.checkOut}</div>
                </div>
                {/* Guests count shown in Stay Details as requested */}
                <div>
                  <div className="text-sm text-gray-700">Guests</div>
                  <div className="font-medium">{Number(booking.booking?.guests || 1)}</div>
                </div>
                {typeof booking.booking?.nights !== 'undefined' && (
                  <div>
                    <div className="text-sm text-gray-700">Nights</div>
                    <div className="font-medium">{Number(booking.booking?.nights || 1)}</div>
                  </div>
                )}
              </div>

              {/* Content after Nights removed as requested */}
            </div>

            {/* Hotel tile removed as per request */}
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border p-4 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Your Stay</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${String(booking.status).toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{String(booking.status || 'confirmed').toUpperCase()}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">📅 {booking.booking?.checkIn} → {booking.booking?.checkOut}</span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">👤 {Number(booking.booking?.guests || 1)} guest{Number(booking.booking?.guests || 1) > 1 ? 's' : ''}</span>
                {typeof booking.booking?.nights !== 'undefined' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">🌙 {Number(booking.booking?.nights || 1)} night{Number(booking.booking?.nights || 1) > 1 ? 's' : ''}</span>
                ) : null}
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between"><span>Price per night</span><span className="font-semibold">{fmtInr(perNightDisplay)}</span></div>
                {typeof booking.totals?.nights !== 'undefined' && (
                  <div className="flex justify-between"><span>Nights</span><span className="font-semibold">{Number(booking.totals?.nights || booking.booking?.nights || 1)}</span></div>
                )}
                {typeof booking.totals?.subtotal !== 'undefined' && (
                  <div className="flex justify-between"><span>Subtotal</span><span className="font-semibold">{fmtInr(booking.totals?.subtotal)}</span></div>
                )}
                {typeof booking.totals?.taxes !== 'undefined' && (
                  <div className="flex justify-between"><span>Taxes</span><span className="font-semibold">{fmtInr(booking.totals?.taxes)}</span></div>
                )}
                {typeof booking.totals?.fees !== 'undefined' && (
                  <div className="flex justify-between"><span>Fees</span><span className="font-semibold">{fmtInr(booking.totals?.fees)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t"><span>Total payable</span><span className="text-xl font-bold text-brand-accent">{fmtInr(booking.totals?.payable || booking.total || 0)}</span></div>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                Flexible cancellation within 24h prior to check-in. Policies may vary by hotel.
              </div>
              <div className="mt-4 flex items-center gap-2">
                <PressScale className="inline-block w-full">
                  <button onClick={() => window.print()} className="btn-primary w-full">Download Receipt</button>
                </PressScale>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageFade>
  )
}
