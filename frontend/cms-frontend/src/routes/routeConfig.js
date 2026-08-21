/**
 * Navigation configuration per role.
 * `key` maps to the react-router route path.
 *
 * Role codes used (from backend):
 *   SYSTEM : ADMIN, CTNMGR
 *   CANTEEN: CTNMNG (manager), CTNAST (assistant), CTNSTF (kiosk/staff)
 *   OTHER  : EMPLOYEE (derived — any logged-in user with a CUSTOMER record but no canteen roles)
 */

export const ADMIN_NAV = [
  { key: 'identity', label: 'Identity' }
]

export const CANTEEN_MANAGER_NAV = [
  { key: 'dashboard',  label: 'Dashboard'     },
  { key: 'catalog',    label: 'Menu Items'     },
  { key: 'services',   label: 'Services'       },
  { key: 'dayslots',   label: 'Day Slots'      },
  { key: 'daymenu',    label: 'Menu Planning', hasBadge: true, badgeKey: 'pendingMenus' },
  { key: 'kitchen-prep', label: 'Kitchen Prep'   },
  { key: 'bookings',   label: 'Bookings'       },
  { key: 'pricing',    label: 'Pricing'        },
  { key: 'wallet',     label: 'Wallet',        hasBadge: true, badgeKey: 'pendingWithdrawals' },
]

export const CANTEEN_ASSISTANT_NAV = [
  { key: 'dashboard',  label: 'Dashboard'     },
  { key: 'catalog',    label: 'Menu Items'     },
  { key: 'services',   label: 'Services'       },
  { key: 'dayslots',   label: 'Day Slots'      },
  { key: 'daymenu',    label: 'Menu Planning', hasBadge: true, badgeKey: 'pendingMenus' },
  { key: 'kitchen-prep', label: 'Kitchen Prep'   },
  { key: 'bookings',   label: 'Bookings'       },
]

export const EMPLOYEE_NAV = [
  { key: 'home',       label: 'Home'           },
  { key: 'prebooking', label: 'Pre-Booking'    },
  { key: 'mybookings', label: 'My Bookings'    },
  // wallet tab is added dynamically for contract employees
]

export const EMPLOYEE_CONTRACT_EXTRA = [
  { key: 'wallet',     label: 'Wallet'         },
]

/**
 * Returns the nav tabs for the current user based on their role codes.
 * @param {object} perms — from usePermissions()
 * @param {object} user  — from useAuth()
 * @param {object} customer — from useAuth()
 * @param {object} badges — { pendingMenus, pendingWithdrawals }
 */
export function getNavTabs(perms, user, customer, badges = {}) {
  let base = []

  if (perms.isAdmin) {
    base.push(...ADMIN_NAV)
  }

  if (perms.isCanteenManager) {
    base.push(...CANTEEN_MANAGER_NAV)
  } else if (perms.isCanteenAssistant || perms.isCanteenStaff) {
    base.push(...CANTEEN_ASSISTANT_NAV)
  }

  // Employee tabs
  if (perms.isEmployee || base.length === 0) {
    base.push(...EMPLOYEE_NAV)
    // Contract employees get a wallet tab
    if (customer?.CTYPECODE === 'CONTEMP' || customer?.CTYPECODE === 'CNT') {
      base.push(...EMPLOYEE_CONTRACT_EXTRA)
    }
  }

  return base.map(tab => ({
    ...tab,
    badge: tab.hasBadge ? (badges[tab.badgeKey] ?? 0) : 0,
  }))
}

/** Default landing tab key for a given role */
export function getDefaultTab(perms) {
  if (perms.isAdmin && !perms.isCanteenWorker) return 'identity'
  if (perms.isCanteenWorker) return 'dashboard'
  return 'home'
}
