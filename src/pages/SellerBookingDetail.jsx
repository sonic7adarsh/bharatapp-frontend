import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import sellerService from '../services/sellerService'

export default function SellerBookingDetail() {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const data = await sellerService.getBooking(bookingId)
        if (!active) return
        setBooking(data || null)
      } catch (err) {
        if (!active) return
        setError(err?.message || 'Failed to load booking')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [bookingId])

  async function updateStatus(nextStatus) {
    try {
      await sellerService.updateBookingStatus(bookingId, { status: nextStatus })
      setBooking((prev) => prev ? { ...prev, status: nextStatus } : prev)
    } catch (err) {
      console.error('Failed to update booking status', err)
    }
  }

  const guest = booking?.customer || booking?.buyer || {}
  const items = booking?.items || booking?.rooms || []

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Booking Detail</h1>
        <Link to="/seller/bookings" className="text-blue-600 hover:underline">Back to Bookings</Link>
      </div>

      {loading && <p>Loading booking…</p>}
      {error && <p className="text-red-600">{String(error)}</p>}

      {!loading && booking && (
        <div className="space-y-6">
          <div className="p-4 bg-white rounded border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Reference</div>
                <div className="text-lg font-semibold">{booking.reference || booking.id}</div>
              </div>
              <div>
                <span className="px-2 py-1 rounded bg-gray-100 text-sm">{booking.status || '-'}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-sm text-gray-600">Guest</div>
                <div className="font-medium">{guest.name || guest.fullName || '-'}</div>
                <div className="text-sm text-gray-600">{guest.phone || guest.mobile || guest.email || ''}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Dates</div>
                <div className="font-medium">
                  {booking.checkInDate || booking.startDate || '-'} → {booking.checkOutDate || booking.endDate || '-'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded border">
            <div className="font-semibold mb-2">Rooms</div>
            {items.length === 0 ? (
              <div className="text-gray-600">No room items.</div>
            ) : (
              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li key={it.id || idx} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{it.name || it.roomType || `Room ${idx + 1}`}</div>
                      <div className="text-sm text-gray-600">Guests: {it.guests || it.quantity || 1}</div>
                    </div>
                    <div className="text-sm">₹{Number(it.price || it.amount || 0).toFixed(0)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-4 bg-white rounded border">
            <div className="font-semibold mb-2">Actions</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => updateStatus('confirmed')}>Confirm</button>
              <button className="px-3 py-1 rounded bg-green-600 text-white" onClick={() => updateStatus('checked_in')}>Check In</button>
              <button className="px-3 py-1 rounded bg-emerald-700 text-white" onClick={() => updateStatus('checked_out')}>Check Out</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => updateStatus('cancelled')}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}