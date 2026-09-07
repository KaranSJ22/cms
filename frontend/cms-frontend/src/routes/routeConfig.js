/**
 * Navigation configuration per role with Category and Icon identifiers.
 * Role codes used (from backend):
 *   SYSTEM : ADMIN, CTNMGR
 *   CANTEEN: CTNMGR (manager), CTNAST (assistant), CTNSTF (kiosk/staff)
 *   OTHER  : EMPLOYEE (derived — any logged-in user with a CUSTOMER record but no canteen roles)
 */

export const ADMIN_NAV = [
  { key: 'identity', label: 'Identity & Access', category: 'admin', icon: 'IdentificationIcon' },
  { key: 'holidays', label: 'Canteen Holidays', category: 'admin', icon: 'CalendarDaysIcon' }
]

export const CANTEEN_MANAGER_NAV = [
  // Operations
  { key: 'dashboard', label: 'Operations Dashboard', category: 'operations', icon: 'Squares2X2Icon' },
  { key: 'bookings', label: 'Bookings Monitor', category: 'operations', icon: 'TicketIcon' },

  // Menu & Planning
  { key: 'catalog', label: 'Menu Catalog', category: 'menu', icon: 'BookOpenIcon' },
  { key: 'menu-templates', label: 'Menu Templates', category: 'menu', icon: 'RectangleStackIcon' },
  { key: 'services', label: 'Service Slots', category: 'menu', icon: 'ClockIcon' },
  { key: 'dayslots', label: 'Day Slots', category: 'menu', icon: 'CalendarIcon' },
  { key: 'daymenu', label: 'Menu Planner', category: 'menu', icon: 'ClipboardDocumentCheckIcon', hasBadge: true, badgeKey: 'pendingMenus' },
  { key: 'bulk-menu', label: 'Bulk Menu Creator', category: 'menu', icon: 'QueueListIcon' },

  // Terminals & Kiosks
  { key: 'kiosk/serving-terminal', label: 'Serving Terminal', category: 'terminals', icon: 'ComputerDesktopIcon' },
  { key: 'kiosk/self-service', label: 'Self-Service Kiosk', category: 'terminals', icon: 'DeviceTabletIcon' },

  // Finance & Admin
  { key: 'pricing', label: 'Pricing', category: 'finance', icon: 'CurrencyRupeeIcon' },
  { key: 'wallet', label: 'Wallet Management', category: 'finance', icon: 'WalletIcon', hasBadge: true, badgeKey: 'pendingWithdrawals' },
  { key: 'holidays', label: 'Canteen Holidays', category: 'finance', icon: 'CalendarDaysIcon' },
]

export const CANTEEN_ASSISTANT_NAV = [
  // Operations
  { key: 'dashboard', label: 'Operations Dashboard', category: 'operations', icon: 'Squares2X2Icon' },
  { key: 'bookings', label: 'Bookings Monitor', category: 'operations', icon: 'TicketIcon' },

  // Menu & Planning
  { key: 'catalog', label: 'Menu Catalog', category: 'menu', icon: 'BookOpenIcon' },
  { key: 'menu-templates', label: 'Menu Templates', category: 'menu', icon: 'RectangleStackIcon' },
  { key: 'services', label: 'Service Slots', category: 'menu', icon: 'ClockIcon' },
  { key: 'dayslots', label: 'Day Calendar Slots', category: 'menu', icon: 'CalendarIcon' },
  { key: 'daymenu', label: 'Menu Planner', category: 'menu', icon: 'ClipboardDocumentCheckIcon', hasBadge: true, badgeKey: 'pendingMenus' },
  { key: 'bulk-menu', label: 'Bulk Menu Creator', category: 'menu', icon: 'QueueListIcon' },

  // Terminals
  { key: 'kiosk/serving-terminal', label: 'Serving Terminal', category: 'terminals', icon: 'ComputerDesktopIcon' },
]

export const CANTEEN_STAFF_NAV = [
  { key: 'dashboard', label: 'Operations Dashboard', category: 'operations', icon: 'Squares2X2Icon' },
  { key: 'kiosk/serving-terminal', label: 'Serving Terminal', category: 'terminals', icon: 'ComputerDesktopIcon' },
  { key: 'bookings', label: 'Bookings Monitor', category: 'operations', icon: 'TicketIcon' },
]

export const EMPLOYEE_NAV = [
  { key: 'home', label: 'Employee Portal', category: 'employee', icon: 'HomeIcon' },
  { key: 'prebooking', label: 'Pre-Book Meals', category: 'employee', icon: 'ShoppingBagIcon' },
  { key: 'mybookings', label: 'My Bookings', category: 'employee', icon: 'DocumentTextIcon' },
]

export const EMPLOYEE_CONTRACT_EXTRA = [
  { key: 'my-wallet', label: 'My Wallet', category: 'employee', icon: 'CreditCardIcon' },
]

export const CATEGORY_LABELS = {
  operations: 'Operations & Live',
  menu: 'Menu Planning & Catalog',
  terminals: 'Serving & Terminals',
  finance: 'Tariffs & Wallet',
  admin: 'Administration',
  employee: 'Employee Services',
}

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
  } else if (perms.isCanteenAssistant) {
    base.push(...CANTEEN_ASSISTANT_NAV)
  } else if (perms.isCanteenStaff) {
    base.push(...CANTEEN_STAFF_NAV)
  }

  // Employee tabs
  if (perms.isEmployee || base.length === 0) {
    base.push(...EMPLOYEE_NAV)
    // Contract employees & Visitors get a wallet tab
    const isEligibleCustomer =
      customer?.CTYPECODE === 'CONTEMP' ||
      customer?.CTYPECODE === 'CNT' ||
      customer?.CTYPECODE === 'VIS' ||
      customer?.CTYPECODE === 'VISITOR'

    if (isEligibleCustomer) {
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
