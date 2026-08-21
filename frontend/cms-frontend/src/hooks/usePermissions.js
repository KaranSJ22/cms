import { useAuth } from './useAuth'

/**
 * Role-checking utilities based on the backend's dual role system:
 *   SYSTEMROLES  — global roles: 'ADMIN', 'CTNMGR'
 *   CANTEENROLES — canteen-scoped roles: [{CANTEENID, ROLECODE, ISDEFAULT}]
 *                  ROLECODE values: 'CTNMNG', 'CTNAST', 'CTNSTF'
 */
export function usePermissions() {
  const { user } = useAuth()

  if (!user) {
    return {
      hasSystemRole: () => false,
      hasCanteenRole: () => false,
      isAdmin: false,
      isCanteenManager: false,
      isCanteenAssistant: false,
      isCanteenStaff: false,
      isEmployee: false,
      isCanteenWorker: false,
      canManageMenu: false,
      canApproveDayMenu: false,
      canManageWallet: false,
      canServeBookings: false,
      primaryRole: null,
    }
  }

  const sysRoles = user.SYSTEMROLES ?? []
  const canteenRoles = (user.CANTEENROLES ?? []).map(r => r.ROLECODE)

  /** Check if user has a specific SYSTEMROLE */
  function hasSystemRole(...roles) {
    return roles.some(r => sysRoles.includes(r))
  }

  /** Check if user has a specific CANTEENROLE */
  function hasCanteenRole(...roles) {
    return roles.some(r => canteenRoles.includes(r))
  }

  const isAdmin = hasSystemRole('ADMIN')
  const isCanteenManager = hasCanteenRole('CTNMNG')
  const isCanteenAssistant = hasCanteenRole('CTNAST')
  const isCanteenStaff = hasCanteenRole('CTNSTF')
  const isCanteenWorker = isCanteenManager || isCanteenAssistant || isCanteenStaff

  // Employee = has a CUSTOMER record but no canteen roles
  const isEmployee = !isCanteenWorker && !isAdmin

  // Feature-level permission shortcuts
  const canManageMenu = isCanteenManager || isCanteenAssistant
  const canApproveDayMenu = isCanteenManager
  const canManageWallet = hasSystemRole('ADMIN', 'CTNMGR') // wallet uses system roles
  const canServeBookings = isCanteenManager || isCanteenStaff

  // Derive primary role label for nav/display
  let primaryRole = null
  if (isAdmin) primaryRole = 'ADMIN'
  else if (isCanteenManager) primaryRole = 'CTNMNG'
  else if (isCanteenAssistant) primaryRole = 'CTNAST'
  else if (isCanteenStaff) primaryRole = 'CTNSTF'
  else if (isEmployee) primaryRole = 'EMPLOYEE'

  return {
    hasSystemRole,
    hasCanteenRole,
    isAdmin,
    isCanteenManager,
    isCanteenAssistant,
    isCanteenStaff,
    isEmployee,
    isCanteenWorker,
    canManageMenu,
    canApproveDayMenu,
    canManageWallet,
    canServeBookings,
    primaryRole,
  }
}
