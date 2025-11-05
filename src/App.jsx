import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
const Home = lazy(() => import('./pages/Home'))
const Stores = lazy(() => import('./pages/Stores'))
const StoreOnboard = lazy(() => import('./pages/StoreOnboard'))
const StoreDetail = lazy(() => import('./pages/StoreDetail'))
const StoreDashboard = lazy(() => import('./pages/StoreDashboard'))
const AddProduct = lazy(() => import('./pages/AddProduct'))
const Login = lazy(() => import('./pages/Login'))
const MobileLogin = lazy(() => import('./pages/MobileLogin'))
const Register = lazy(() => import('./pages/Register'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const CheckoutOptions = lazy(() => import('./pages/CheckoutOptions'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const AddProductPublic = lazy(() => import('./pages/AddProductPublic'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const RoomBooking = lazy(() => import('./pages/RoomBooking'))
const Hotels = lazy(() => import('./pages/Hotels'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/onboard" element={<StoreOnboard />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mobile-login" element={<MobileLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/options" element={<CheckoutOptions />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/book/:storeId/:roomId" element={<RoomBooking />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <StoreDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/products/add" element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          } />
          <Route path="/products/add-open" element={<AddProductPublic />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
