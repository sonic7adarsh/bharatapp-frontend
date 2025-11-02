import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import storeService from '../services/storeService'
import { STORES } from '../data/stores'
import useCart from '../context/CartContext'
import { SkeletonStoreHeader, SkeletonProductCard } from '../components/Skeletons'

export default function StoreDetail() {
  const { id } = useParams()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [storeError, setStoreError] = useState(null)
  const [productsError, setProductsError] = useState(null)
  const { addItem, updateItemQuantity, removeItem, items, itemsCount, totalPrice } = useCart()
  const [addingId, setAddingId] = useState(null)

  useEffect(() => {
    const fetchStoreDetails = async () => {
      try {
        setLoading(true)
        
        // Fetch store details
        const fetchedStore = await storeService.getStore(id)
        if (fetchedStore) {
          setStore(fetchedStore)
          setStoreError(null)
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
        
        // Fetch store products
        const fetchedProducts = await storeService.getProductsByStore(id)
        if (Array.isArray(fetchedProducts)) {
          setProducts(fetchedProducts)
          setProductsError(null)
        } else {
          setProductsError('Failed to load products. Please try again later.')
        }
      } catch (error) {
        console.error('Error fetching store details:', error)
        
        // Handle API errors
        if (error.response?.status === 404) {
          setStoreError('Store not found')
        } else {
          setStoreError('Failed to load store details. Please try again later.')
        }
        
        // Fallback to local data if available
        const localStore = STORES.find(s => s.id === id)
        if (localStore) {
          setStore(localStore)
          setProducts(localStore.products || [])
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStoreDetails()
  }, [id])

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <SkeletonStoreHeader />
        <section className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (<SkeletonProductCard key={idx} />))}
          </div>
        </section>
      </main>
    )
  }

  if (storeError && !store) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-md mb-6">
          <p className="font-medium">Error</p>
          <p>{storeError}</p>
        </div>
        <Link to="/stores" className="text-indigo-600 hover:text-indigo-800 font-medium">
          &larr; Back to Stores
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Store Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
            <p className="text-gray-600 mt-1">{store.category}</p>
            <div className="mt-2 flex items-center">
              <span className="text-yellow-500 mr-1">⭐</span>
              <span className="font-medium">{store.rating || '4.5'}</span>
            </div>
            <p className="mt-3 text-gray-700">
              {store.address || store.area || 'Location information not available'}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md">
              Contact Store
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Products</h2>
          {productsError && (
            <p className="text-red-600 text-sm">{productsError}</p>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
            <p>No products available for this store.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => {
              const cartItem = items.find(i => i.id === product.id)
              const qty = cartItem?.quantity || 0
              return (
              <div key={product.id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-40 md:h-48 object-cover rounded-md mb-3"
                  />
                )}
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{product.description || 'No description available'}</p>
                <div className="mt-auto pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg">₹{product.price}</span>
                  {qty > 0 ? (
                    <div className="inline-flex items-center bg-indigo-50 text-indigo-700 rounded-md">
                      <button
                        onClick={() => qty <= 1 ? removeItem(product.id) : updateItemQuantity(product.id, qty - 1)}
                        className="px-3 py-1 hover:bg-indigo-100 rounded-l-md"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 font-semibold">{qty}</span>
                      <button
                        onClick={() => updateItemQuantity(product.id, qty + 1)}
                        className="px-3 py-1 hover:bg-indigo-100 rounded-r-md"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        addItem(product, 1)
                        setAddingId(product.id)
                        setTimeout(() => setAddingId(null), 700)
                      }}
                      disabled={addingId === product.id}
                      className={`px-3 py-1 rounded-md text-sm transition transform active:scale-95 ${addingId === product.id ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
                    >
                      {addingId === product.id ? 'Added!' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </section>

      {/* Sticky Cart Bar */}
      {itemsCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30">
          <div className="mx-auto max-w-5xl px-4 pb-4">
            <div className="bg-white shadow-lg rounded-lg p-3 flex items-center justify-between border">
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center justify-center bg-indigo-600 text-white font-semibold rounded-full h-7 min-w-[28px] px-2 text-sm">
                  {itemsCount}
                </span>
                <span className="font-semibold">Cart Subtotal</span>
                <span className="text-gray-700">₹{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Link to="/cart" className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">View Cart</Link>
                <Link to="/checkout/options" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Checkout</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
