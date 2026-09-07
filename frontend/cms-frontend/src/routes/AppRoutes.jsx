import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
// Layouts
import AppLayout from '../layouts/AppLayout'
import AuthLayout from '../layouts/AuthLayout'
import StaffTerminalLayout from '../layouts/StaffTerminalLayout'
import EmployeeKioskLayout from '../layouts/EmployeeKioskLayout'
import ProtectedRoute from './ProtectedRoute'
import { usePermissions } from '../hooks/usePermissions'
import { getDefaultTab } from './routeConfig'

// Lazy-load all pages for code splitting
const LoginPage         = lazy(() => import('../features/auth/pages/LoginPage'))
const SsoCallbackPage   = lazy(() => import('../features/auth/pages/SsoCallbackPage'))

// Canteen pages
const CanteenDashPage   = lazy(() => import('../features/dashboard/CanteenDashboardPage'))
const CatalogPage       = lazy(() => import('../features/menu/pages/MenuCatalogPage'))
const ServicesPage      = lazy(() => import('../features/services/pages/ServicesPage'))
const DaySlotsPage      = lazy(() => import('../features/dayslot/pages/DaySlotsPage'))
const DayMenuPage       = lazy(() => import('../features/daymenu/pages/DayMenuPlannerPage'))
const BulkMenuCreatorPage = lazy(() => import('../features/daymenu/pages/BulkMenuCreatorPage'))
const BookingsMonitorPage = lazy(() => import('../features/booking/pages/BookingsMonitorPage'))
const PricingPage       = lazy(() => import('../features/pricing/pages/PricingPage'))
const WalletPage        = lazy(() => import('../features/wallet/pages/WalletPage'))
const MenuTemplatesPage = lazy(() => import('../features/menutemplates/pages/MenuTemplatesPage'))

// SYSADM pages
const IdentityPage      = lazy(() => import('../features/identity/pages/IdentityPage'))
const HolidaysPage      = lazy(() => import('../features/holidays/pages/HolidaysPage'))

// Kiosk / Terminal pages
const KioskBootResolver    = lazy(() => import('../features/kiosk/pages/KioskBootResolver'))
const SelfServiceKioskPage = lazy(() => import('../features/kiosk/pages/SelfServiceKioskPage'))
const ServingTerminalPage  = lazy(() => import('../features/kiosk/pages/ServingTerminalPage'))

// Employee pages
const EmployeeHomePage  = lazy(() => import('../features/dashboard/EmployeeHomePage'))
const PreBookingPage    = lazy(() => import('../features/booking/pages/PreBookingPage'))
const MyBookingsPage    = lazy(() => import('../features/booking/pages/MyBookingsPage'))
const EmpWalletPage     = lazy(() => import('../features/wallet/pages/EmployeeWalletPage'))

function LandingRedirect() {
  const perms = usePermissions()
  const defaultTab = getDefaultTab(perms)
  return <Navigate to={`/${defaultTab}`} replace />
}

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
      <Route path="/sso/callback" element={<PageSuspense><SsoCallbackPage /></PageSuspense>} />

      {/* ── Protected App ── */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Canteen worker routes */}
        <Route path="/dashboard"  element={<PageSuspense><CanteenDashPage /></PageSuspense>} />
        <Route path="/catalog"    element={<PageSuspense><CatalogPage /></PageSuspense>} />
        <Route path="/services"   element={<PageSuspense><ServicesPage /></PageSuspense>} />
        <Route path="/dayslots"   element={<PageSuspense><DaySlotsPage /></PageSuspense>} />
        <Route path="/daymenu"    element={<PageSuspense><DayMenuPage /></PageSuspense>} />
        <Route path="/bulk-menu"  element={
          <ProtectedRoute allowedRoles={['CNTMGR', 'CNTAST']}>
            <PageSuspense><BulkMenuCreatorPage /></PageSuspense>
          </ProtectedRoute>
        } />
        <Route path="/kitchen-prep" element={<Navigate to="/dashboard" replace />} />
        <Route path="/bookings"   element={<PageSuspense><BookingsMonitorPage /></PageSuspense>} />
        <Route path="/pricing"    element={
          <ProtectedRoute requirePermission="canApproveDayMenu">
            <PageSuspense><PricingPage /></PageSuspense>
          </ProtectedRoute>
        } />
        <Route path="/wallet"     element={
          <ProtectedRoute requirePermission="canManageWallet">
            <PageSuspense><WalletPage /></PageSuspense>
          </ProtectedRoute>
        } />
        <Route path="/menu-templates" element={
          <ProtectedRoute allowedRoles={['CNTMGR', 'CNTAST']}>
            <PageSuspense><MenuTemplatesPage /></PageSuspense>
          </ProtectedRoute>
        } />
        <Route path="/reports/kitchen-summary" element={<Navigate to="/dashboard" replace />} />
        
        {/* SYSADM routes */}
        <Route path="/identity"   element={
          <ProtectedRoute allowedRoles={['SYSADM']}>
            <PageSuspense><IdentityPage /></PageSuspense>
          </ProtectedRoute>
        } />
        <Route path="/holidays"   element={
          <ProtectedRoute allowedRoles={['SYSADM', 'CNTMGR']}>
            <PageSuspense><HolidaysPage /></PageSuspense>
          </ProtectedRoute>
        } />

        {/* Employee routes */}
        <Route path="/home"       element={<PageSuspense><EmployeeHomePage /></PageSuspense>} />
        <Route path="/booking"    element={<Navigate to="/prebooking" replace />} />
        <Route path="/prebooking" element={<PageSuspense><PreBookingPage /></PageSuspense>} />
        <Route path="/mybookings" element={<PageSuspense><MyBookingsPage /></PageSuspense>} />
        <Route path="/my-wallet"  element={<PageSuspense><EmpWalletPage /></PageSuspense>} />
        <Route path="/wallet/me"  element={<Navigate to="/my-wallet" replace />} />

        {/* Default redirect based on role */}
        <Route index element={<LandingRedirect />} />
      </Route>

      {/* ── Dedicated Hardware Terminals & Kiosks (NO Sidebars) ── */}
      <Route path="/kiosk" element={<PageSuspense><KioskBootResolver /></PageSuspense>} />

      {/* 1. Staff Counter Station (Operator Login + Serving Terminal) */}
      <Route element={<StaffTerminalLayout />}>
        <Route path="/kiosk/serving-terminal" element={<PageSuspense><ServingTerminalPage /></PageSuspense>} />
        <Route path="/kiosk/serving" element={<Navigate to="/kiosk/serving-terminal" replace />} />
      </Route>

      {/* 2. Employee Self-Service Station (Lobby Kiosk with Auto-Reset) */}
      <Route element={<EmployeeKioskLayout />}>
        <Route path="/kiosk/self-service" element={<PageSuspense><SelfServiceKioskPage /></PageSuspense>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
