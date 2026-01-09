import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { seedSampleOrdersIfEmpty } from './lib/bootstrap'
import { AnnouncerProvider } from './context/AnnouncerContext'
import { I18nProvider } from './context/I18nContext'

// Seed deterministic sample orders for local development
seedSampleOrdersIfEmpty()



createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <AnnouncerProvider>
          <AuthProvider>
            <CartProvider>
              <App />
              <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
            </CartProvider>
          </AuthProvider>
        </AnnouncerProvider>
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
)
