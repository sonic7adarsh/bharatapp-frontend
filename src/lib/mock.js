// Simple mock data generators used when API calls fail

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const sampleNames = [
  'Organic Rice',
  'Whole Wheat Flour',
  'Cold Pressed Oil',
  'Masala Mix',
  'Green Tea',
  'Honey',
  'Cookies',
  'Almonds',
  'Cashews',
  'Spices Pack',
]

const sampleCategories = [
  'Grocery',
  'Staples',
  'Snacks',
  'Beverages',
  'Personal Care',
]

export const generateProducts = (count = 8) => {
  const products = Array.from({ length: count }).map((_, idx) => {
    const name = sampleNames[randomInt(0, sampleNames.length - 1)]
    const price = randomInt(49, 499)
    const category = sampleCategories[randomInt(0, sampleCategories.length - 1)]
    return {
      id: `prod_${Date.now()}_${idx}_${randomInt(1000, 9999)}`,
      name,
      description: `${name} - premium quality`,
      price,
      category,
      image: `https://picsum.photos/seed/${encodeURIComponent(name)}/${randomInt(200, 400)}`,
      stock: randomInt(5, 50),
    }
  })
  return products
}

export const generateCategories = () => {
  return sampleCategories.map((name, idx) => ({ id: `cat_${idx}`, name }))
}

export const generateCart = () => {
  try {
    const saved = localStorage.getItem('cart')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  const products = generateProducts(3)
  const cart = products.map(p => ({ id: p.id, name: p.name, price: p.price, quantity: randomInt(1, 3) }))
  try { localStorage.setItem('cart', JSON.stringify(cart)) } catch {}
  return cart
}

export const generateOrders = (count = 4) => {
  const orders = Array.from({ length: count }).map((_, idx) => {
    const total = randomInt(199, 1299)
    return {
      id: `order_${Date.now()}_${idx}_${randomInt(1000, 9999)}`,
      reference: `MOCK-${randomInt(100000, 999999)}`,
      status: ['placed', 'processing', 'shipped', 'delivered'][randomInt(0, 3)],
      total,
      createdAt: new Date(Date.now() - randomInt(0, 7) * 86400000).toISOString(),
      items: generateProducts(randomInt(1, 3)).map(p => ({ id: p.id, name: p.name, price: p.price, quantity: randomInt(1, 2) })),
    }
  })
  return orders
}

export const generateUser = () => {
  const id = `user_${randomInt(1000, 9999)}`
  const name = `Guest ${randomInt(100, 999)}`
  const email = `guest${randomInt(1000, 9999)}@example.com`
  return { id, name, email, role: 'customer' }
}