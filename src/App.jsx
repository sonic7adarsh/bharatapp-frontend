import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
const Home = lazy(() => import('./pages/Home'))
const Stores = lazy(() => import('./pages/Stores'))
const Partner = lazy(() => import('./pages/Partner'))
const StoreOnboard = lazy(() => import('./pages/StoreOnboard'))
const StoreDetail = lazy(() => import('./pages/StoreDetail'))
const StoreDashboard = lazy(() => import('./pages/StoreDashboard'))
const AddProduct = lazy(() => import('./pages/AddProduct'))
const Login = lazy(() => import('./pages/Login'))
const MobileLogin = lazy(() => import('./pages/MobileLogin'))
const Register = lazy(() => import('./pages/Register'))
const SellerLogin = lazy(() => import('./pages/SellerLogin'))
const SellerRegister = lazy(() => import('./pages/SellerRegister'))
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
const SellerOrders = lazy(() => import('./pages/SellerOrders'))
const SellerOrderDetail = lazy(() => import('./pages/SellerOrderDetail'))
const SellerBookings = lazy(() => import('./pages/SellerBookings'))
const SellerBookingDetail = lazy(() => import('./pages/SellerBookingDetail'))
const AddRoom = lazy(() => import('./pages/AddRoom'))
const SellerProducts = lazy(() => import('./pages/SellerProducts'))
const EditStore = lazy(() => import('./pages/EditStore'))

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="p-6 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/hotels" element={<Hotels />} />
          {/* Hotel detail alias to avoid mixing with /store in hotels context */}
          <Route path="/hotels/:id" element={<StoreDetail />} />
          <Route path="/partner" element={<Partner />} />
          <Route path="/onboard" element={
            <ProtectedRoute>
              <StoreOnboard />
            </ProtectedRoute>
          } />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mobile-login" element={<MobileLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout/options" element={
            <ProtectedRoute>
              <CheckoutOptions />
            </ProtectedRoute>
          } />
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />
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
          <Route path="/seller/stores/:storeId/edit" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <EditStore />
            </RoleProtectedRoute>
          } />
          <Route path="/admin" element={
            <RoleProtectedRoute roles={["admin"]}>
              <AdminDashboard />
            </RoleProtectedRoute>
          } />
          <Route path="/seller/bookings" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <SellerBookings />
            </RoleProtectedRoute>
          } />
          <Route path="/seller/bookings/:bookingId" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <SellerBookingDetail />
            </RoleProtectedRoute>
          } />
          <Route path="/seller/orders" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <SellerOrders />
            </RoleProtectedRoute>
          } />
          <Route path="/seller/orders/:orderId" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <SellerOrderDetail />
            </RoleProtectedRoute>
          } />
          <Route path="/products/add" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <AddProduct />
            </RoleProtectedRoute>
          } />
          <Route path="/seller/products" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <SellerProducts />
            </RoleProtectedRoute>
          } />
          <Route path="/rooms/add" element={
            <RoleProtectedRoute roles={["seller","admin"]}>
              <AddRoom />
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
