import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'

/**
 * ProtectedRoute — guards authenticated routes.
 * Optionally accepts `requireRoles` (array of system or canteen role codes)
 * and `requirePermission` (string name of a permission from usePermissions).
 */
export default function ProtectedRoute({ children, requirePermission = null, allowedRoles = null }) {
  const { user, loading } = useAuth()
  const location          = useLocation()
  const perms             = usePermissions()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check specific permission if required
  if (requirePermission && !perms[requirePermission]) {
    return <Navigate to="/" replace />
  }

  // Check specific roles if required
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const hasRole = perms.hasSystemRole(...allowedRoles) || perms.hasCanteenRole(...allowedRoles);
    if (!hasRole) {
      return <Navigate to="/" replace />
    }
  }

  return children
}
