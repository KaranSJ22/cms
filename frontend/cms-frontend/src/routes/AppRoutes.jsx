import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import UnderConstruction from '../components/common/UnderConstruction'
// Lazy-load all pages for code splitting
const LoginPage         = lazy(() => import('../features/auth/pages/LoginPage'))

// Canteen pages
const CanteenDashPage   = UnderConstruction; // lazy(() => import('../features/dashboard/pages/CanteenDashboardPage'))
const CatalogPage       = lazy(() => import('../features/menu/pages/MenuCatalogPage'))
const ServicesPage      = lazy(() => import('../features/services/pages/ServicesPage'))
const DaySlotsPage      = lazy(() => import('../features/dayslot/pages/DaySlotsPage'))
const DayMenuPage       = lazy(() => import('../features/daymenu/pages/DayMenuPlannerPage'))
const KitchenPrepPage   = lazy(() => import('../features/booking/pages/KitchenPrepDashboard'))
const BookingsMonitorPage = UnderConstruction; // lazy(() => import('../features/booking/pages/BookingsMonitorPage'))
const PricingPage       = lazy(() => import('../features/pricing/pages/PricingPage'))
const WalletPage        = UnderConstruction; // lazy(() => import('../features/wallet/pages/WalletPage'))
// const ServingKioskPage  = lazy(() => import('../features/booking/pages/ServingKioskPage'))

// Admin pages
const IdentityPage      = lazy(() => import('../features/identity/pages/IdentityPage'))

// Employee pages
// const EmployeeHomePage  = UnderConstruction; // lazy(() => import('../features/dashboard/pages/EmployeeHomePage'))
const PreBookingPage    = lazy(() => import('../features/booking/pages/PreBookingPage'))
const MyBookingsPage    = lazy(() => import('../features/booking/pages/MyBookingsPage'))
const EmpWalletPage     = UnderConstruction; // lazy(() => import('../features/wallet/pages/EmployeeWalletPage'))

function PageSuspense({ children }) {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    }>
      {children}
    </Suspense>
  )
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth ── */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PageSuspense><LoginPage /></PageSuspense>} />
      </Route>

      {/* ── Protected App ── */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Canteen worker routes */}
        <Route path="/dashboard"  element={<PageSuspense><CanteenDashPage /></PageSuspense>} />
        <Route path="/catalog"    element={<PageSuspense><CatalogPage /></PageSuspense>} />
        <Route path="/services"   element={<PageSuspense><ServicesPage /></PageSuspense>} />
        <Route path="/dayslots"   element={<PageSuspense><DaySlotsPage /></PageSuspense>} />
        <Route path="/daymenu"    element={<PageSuspense><DayMenuPage /></PageSuspense>} />
        <Route path="/kitchen-prep" element={<PageSuspense><KitchenPrepPage /></PageSuspense>} />
        <Route path="/bookings"   element={<PageSuspense><BookingsMonitorPage /></PageSuspense>} />
        <Route path="/pricing"    element={
          <ProtectedRoute requirePermission="canApproveDayMenu">
            <PageSuspense><PricingPage /></PageSuspense>
          </ProtectedRoute>
        } />
        {/* <Route path="/kiosk" element={
          <ProtectedRoute allowedRoles={['CTNMNG', 'CTNSTF']}>
            <PageSuspense><ServingKioskPage /></PageSuspense>
          </ProtectedRoute>
        } /> */}
        <Route path="/wallet"     element={
          <ProtectedRoute requirePermission="canManageWallet">
            <PageSuspense><WalletPage /></PageSuspense>
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/identity"   element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <PageSuspense><IdentityPage /></PageSuspense>
          </ProtectedRoute>
        } />

        {/* Employee routes */}
        {/* <Route path="/home"       element={<PageSuspense><EmployeeHomePage /></PageSuspense>} /> */}
        <Route path="/prebooking" element={<PageSuspense><PreBookingPage /></PageSuspense>} />
        <Route path="/mybookings" element={<PageSuspense><MyBookingsPage /></PageSuspense>} />
        <Route path="/wallet/me"  element={<PageSuspense><EmpWalletPage /></PageSuspense>} />

        {/* Default redirect based on role is handled in App.jsx */}
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
