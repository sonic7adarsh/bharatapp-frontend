// Bootstrap utilities for local development
// Seeds deterministic sample orders into localStorage if none exist

export function seedSampleOrdersIfEmpty() {
  try {
    const saved = localStorage.getItem('orders')
    const existing = saved ? JSON.parse(saved) : null
    if (Array.isArray(existing) && existing.length > 0) return

    const sampleOrders = [
      {
        id: 'order_1001',
        reference: 'MOCK-100001',
        status: 'delivered',
        total: 799,
        createdAt: '2024-10-01T10:15:00.000Z',
        items: [
          { id: 'p_rice', name: 'Organic Rice', price: 399, quantity: 1 },
          { id: 'p_honey', name: 'Honey', price: 400, quantity: 1 },
        ],
        paymentMethod: 'cod'
      },
      {
        id: 'order_1002',
        reference: 'MOCK-100002',
        status: 'shipped',
        total: 1299,
        createdAt: '2024-10-03T14:30:00.000Z',
        items: [
          { id: 'p_oil', name: 'Cold Pressed Oil', price: 699, quantity: 1 },
          { id: 'p_cashews', name: 'Cashews', price: 600, quantity: 1 },
        ],
        paymentMethod: 'online'
      },
      {
        id: 'order_1003',
        reference: 'MOCK-100003',
        status: 'processing',
        total: 499,
        createdAt: '2024-10-05T09:00:00.000Z',
        items: [
          { id: 'p_cookies', name: 'Cookies', price: 199, quantity: 1 },
          { id: 'p_green_tea', name: 'Green Tea', price: 300, quantity: 1 },
        ],
        paymentMethod: 'cod'
      }
    ]

    localStorage.setItem('orders', JSON.stringify(sampleOrders))
  } catch {
    // Ignore localStorage errors in non-browser environments
  }
}