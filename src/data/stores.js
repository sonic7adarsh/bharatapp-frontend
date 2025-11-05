export const STORES = [
  {
    id: 's1',
    name: 'Kumar General Store',
    area: 'South Delhi',
    category: 'Grocery',
    hours: {
      mon: { open: '08:00', close: '22:00' },
      tue: { open: '08:00', close: '22:00' },
      wed: { open: '08:00', close: '22:00' },
      thu: { open: '08:00', close: '22:00' },
      fri: { open: '08:00', close: '22:00' },
      sat: { open: '08:00', close: '22:00' },
      sun: { open: '09:00', close: '21:00' },
    },
    products: [
      { id: 'p1', name: 'Masala Namkeen (250g)', price: 80 },
      { id: 'p2', name: 'Atta (5kg)', price: 420 }
    ],
    rating: 4.5
  },
  {
    id: 's2',
    name: 'Meera Sweets & Snacks',
    area: 'West Delhi',
    category: 'Grocery',
    hours: {
      mon: { open: '09:00', close: '21:00' },
      tue: { open: '09:00', close: '21:00' },
      wed: { open: '09:00', close: '21:00' },
      thu: { open: '09:00', close: '21:00' },
      fri: { open: '09:00', close: '21:00' },
      sat: { open: '09:00', close: '21:00' },
      sun: { open: '10:00', close: '20:00' },
    },
    products: [
      { id: 'p3', name: 'Kaju Burfi (250g)', price: 220 },
      { id: 'p4', name: 'Mixture (200g)', price: 60 }
    ],
    rating: 4.7
  },
  {
    id: 's3',
    name: 'Arogya Pharmacy',
    area: 'Central Delhi',
    category: 'Pharmacy',
    hours: {
      mon: { open: '09:00', close: '21:00' },
      tue: { open: '09:00', close: '21:00' },
      wed: { open: '09:00', close: '21:00' },
      thu: { open: '09:00', close: '21:00' },
      fri: { open: '09:00', close: '21:00' },
      sat: { open: '09:00', close: '21:00' },
      sun: { open: '10:00', close: '20:00' },
    },
    products: [
      { id: 'med1', name: 'Paracetamol 500mg (10 tablets)', price: 35 },
      { id: 'med2', name: 'Amoxicillin 250mg (10 capsules)', price: 85 },
      { id: 'med3', name: 'Cough Syrup (100ml)', price: 60 }
    ],
    rating: 4.6
  },
  {
    id: 's4',
    name: 'Sunrise Hotel',
    area: 'Connaught Place',
    category: 'Hospitality',
    hours: {
      mon: { open: '00:00', close: '23:59' },
      tue: { open: '00:00', close: '23:59' },
      wed: { open: '00:00', close: '23:59' },
      thu: { open: '00:00', close: '23:59' },
      fri: { open: '00:00', close: '23:59' },
      sat: { open: '00:00', close: '23:59' },
      sun: { open: '00:00', close: '23:59' },
    },
    products: [
      { id: 'room1', name: 'Standard Room', price: 1800, description: 'AC room, Wi-Fi, breakfast included' },
      { id: 'room2', name: 'Deluxe Room', price: 2800, description: 'City view, king bed, breakfast included' },
      { id: 'suite1', name: 'Executive Suite', price: 4500, description: 'Separate lounge, balcony, premium amenities' }
    ],
    rating: 4.2
  },
  {
    id: 's5',
    name: 'Pearl Residency',
    area: 'Karol Bagh',
    category: 'Hotels',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800&auto=format&fit=crop',
    hours: {
      mon: { open: '00:00', close: '23:59' },
      tue: { open: '00:00', close: '23:59' },
      wed: { open: '00:00', close: '23:59' },
      thu: { open: '00:00', close: '23:59' },
      fri: { open: '00:00', close: '23:59' },
      sat: { open: '00:00', close: '23:59' },
      sun: { open: '00:00', close: '23:59' },
    },
    products: [
      { id: 'h501', name: 'Standard Room', price: 1500, description: 'Cozy room, Wi-Fi, breakfast included', image: 'https://images.unsplash.com/photo-1554188248-986adbb73be0?q=80&w=800&auto=format&fit=crop' },
      { id: 'h502', name: 'Deluxe Room', price: 2300, description: 'Spacious, king bed, breakfast included', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop' },
      { id: 'h503', name: 'Suite', price: 3800, description: 'Living area, premium amenities', image: 'https://images.unsplash.com/photo-1606046606778-8d1a01df9421?q=80&w=800&auto=format&fit=crop' }
    ],
    rating: 4.4
  },
  {
    id: 's6',
    name: 'City Inn Hotel',
    area: 'Dwarka',
    category: 'Hotels',
    image: 'https://images.unsplash.com/photo-1560067174-8942ec1f06fd?q=80&w=800&auto=format&fit=crop',
    hours: {
      mon: { open: '00:00', close: '23:59' },
      tue: { open: '00:00', close: '23:59' },
      wed: { open: '00:00', close: '23:59' },
      thu: { open: '00:00', close: '23:59' },
      fri: { open: '00:00', close: '23:59' },
      sat: { open: '00:00', close: '23:59' },
      sun: { open: '00:00', close: '23:59' },
    },
    products: [
      { id: 'c601', name: 'Economy Room', price: 1200, description: 'Compact, AC, Wi-Fi', image: 'https://images.unsplash.com/photo-1616593968076-8b1ae0f842d1?q=80&w=800&auto=format&fit=crop' },
      { id: 'c602', name: 'Business Room', price: 2000, description: 'Workspace, king bed', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop' },
      { id: 'c603', name: 'Family Suite', price: 3200, description: 'Two bedrooms, lounge', image: 'https://images.unsplash.com/photo-1600585154340-1e63edb6dd9f?q=80&w=800&auto=format&fit=crop' }
    ],
    rating: 4.1
  },
  {
    id: 's7',
    name: 'Grand Plaza',
    area: 'Gurugram',
    category: 'Hotels',
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5ea?q=80&w=800&auto=format&fit=crop',
    hours: {
      mon: { open: '00:00', close: '23:59' },
      tue: { open: '00:00', close: '23:59' },
      wed: { open: '00:00', close: '23:59' },
      thu: { open: '00:00', close: '23:59' },
      fri: { open: '00:00', close: '23:59' },
      sat: { open: '00:00', close: '23:59' },
      sun: { open: '00:00', close: '23:59' },
    },
    products: [
      { id: 'g701', name: 'Premier Room', price: 2600, description: 'Premium bedding, city view', image: 'https://images.unsplash.com/photo-1600585153872-00f18ff8a564?q=80&w=800&auto=format&fit=crop' },
      { id: 'g702', name: 'Club Room', price: 3400, description: 'Club access, lounge', image: 'https://images.unsplash.com/photo-1606046606778-8d1a01df9421?q=80&w=800&auto=format&fit=crop' },
      { id: 'g703', name: 'Presidential Suite', price: 5200, description: 'Top-floor, panoramic view', image: 'https://images.unsplash.com/photo-1600607687920-4ce58e5f4f29?q=80&w=800&auto=format&fit=crop' }
    ],
    rating: 4.6
  }
]
