import axios from '../lib/axios'

async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) throw new Error('Failed reverse geocode')
    const data = await res.json()
    const addr = data.address || {}
    // Prefer city, then town, then state_district/state
    return addr.city || addr.town || addr.village || addr.state_district || addr.state || ''
  } catch (err) {
    console.error('reverseGeocode failed', err)
    return ''
  }
}

export async function detectCityViaGeolocation() {
  if (!('geolocation' in navigator)) return ''
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords || {}
        const city = await reverseGeocode(latitude, longitude)
        resolve(city || '')
      },
      () => resolve(''),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  })
}

export default { detectCityViaGeolocation }