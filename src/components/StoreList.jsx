import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import storeService from '../services/storeService';
import StoreCard from './StoreCard';
import { SkeletonStoreCard } from './Skeletons';

const StoreList = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const fetchStores = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/stores', { signal: controller.signal });
        setStores(response.data);
        setError(null);
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        console.error('Error fetching stores:', err);
        setError('Failed to load stores. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
    return () => { controller.abort(); };
  }, []);

  const handleStoreClick = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, idx) => (<SkeletonStoreCard key={idx} />))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        <p className="font-medium">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
        <p>No stores found. Check back later for updates.</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
      {stores.map((store) => (
        <li key={store.id} role="listitem">
          <div
            onClick={() => handleStoreClick(store.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleStoreClick(store.id)
              }
            }}
            onMouseEnter={() => { import('../pages/StoreDetail'); storeService.prefetchStoreDetail(store.id) }}
            onFocus={async () => { import('../pages/StoreDetail'); try { const svc = (await import('../services/storeService')).default; svc.prefetchStoreDetail(store.id) } catch {} }}
            onTouchStart={async () => { import('../pages/StoreDetail'); try { const svc = (await import('../services/storeService')).default; svc.prefetchStoreDetail(store.id) } catch {} }}
            className="cursor-pointer"
            role="link"
            tabIndex={0}
            aria-labelledby={`store-${store.id}-name`}
            aria-label={`View ${store.name} store details`}
          >
            <StoreCard store={store} />
          </div>
        </li>
      ))}
    </ul>
  );
};

export default StoreList;