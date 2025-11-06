import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
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
// Switch Checkout to static import to avoid dynamic import fetch errors
import Checkout from './pages/Checkout'
const CheckoutOptions = lazy(() => import('./pages/CheckoutOptions'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const BookingDetail = lazy(() => import('./pages/BookingDetail'))
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
          <Route path="/onboard" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <StoreOnboard />
            </RoleProtectedRoute>
          } />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mobile-login" element={<MobileLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/options" element={<CheckoutOptions />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/orders/:orderId" element={<OrderDetail />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/bookings/:bookingId" element={<BookingDetail />} />
          <Route path="/book/:storeId/:roomId" element={<RoomBooking />} />
          <Route path="/dashboard" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <StoreDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/admin" element={
            <RoleProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/products/add" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <AddProduct />
            </RoleProtectedRoute>
          } />
          <Route path="/products/add-open" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <AddProductPublic />
            </RoleProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Layout>
  )
}
