# CMS Frontend Migration Plan: Figma Prototype → cms-frontend

Migrate the Figma Make JSX prototype's complete UI/UX into the `cms-frontend` target architecture, wiring it to the real backend API with proper authentication, role-based access, and routing.

---

## Confirmed Decisions

| Decision | Choice |
|---|---|
| Styling | **Tailwind CSS v4** (utility classes replace all inline styles) |
| Navigation: Kitchen vs Bookings | **Single "Bookings" page** (no Kitchen tab) |
| Account / Profile screens | **Removed** |
| SSO Login | **Kept** — `POST /api/auth/sso` |
| Role codes | **Backend codes** (`CTNMNG`, `CTNAST`, `ADMIN`, `CTNSTF`, `CTNMGR`) |
| Pricing module | **Confirmed accessible** — full endpoints available |

> [!IMPORTANT]
> **Pricing module — backend access denied**: The `backend/src/modules/pricing/` directory returned a permission error during analysis. The route file (`pricing.routes.js`) is imported in the route index. Once access is restored, we need to verify the pricing API endpoints. The plan assumes standard CRUD: `GET /api/menu-items/:id/prices`, `POST /api/menu-items/:id/prices`, etc. — based on the route mount at `router.use("/", pricingRoutes)`.

> [!IMPORTANT]
> **Backend role codes vs prototype role keys**: The backend uses role codes like `CTNMNG`, `CTNAST`, `ADMIN` (canteen roles) and system roles. The prototype uses `canteen_manager`, `canteen_assistant`, `employee_permanent`, `employee_contract`. The mapping needs to be established:
> | Prototype Role | Backend System Role | Backend Canteen Role |
> |---|---|---|
> | `canteen_manager` | — | `CTNMNG` |
> | `canteen_assistant` | — | `CTNSTF` / `CTNAST` |
> | `employee_permanent` | `EMPLOYEE` (?) | — |
> | `employee_contract` | `EMPLOYEE` (?) | — |
>
> The exact system role codes for employees need to be confirmed from the database seed data or the identity module.

---

## 1. Proposed Final `cms-frontend/src` Structure

```
src/
├── App.jsx                         # Root: AuthProvider → Router
├── main.jsx                        # Entry point (already exists)
├── index.css                       # Global styles, font imports
│
├── assets/                         # Static assets
│   ├── images/
│   │   ├── isro-emblem.png         # ISRO emblem (from prototype imports/)
│   │   └── isro-bg.png            # Login background
│   └── fonts/                      # (if self-hosted)
│
├── config/
│   ├── app.config.js               # [MODIFY] API base URL, app constants
│   └── axios.js                    # [MODIFY] Axios instance with JWT interceptor
│
├── contexts/
│   └── AuthContext.jsx             # [MODIFY] Full auth state, login/logout, /me
│
├── hooks/
│   ├── useAuth.js                  # [MODIFY] Convenience hook for AuthContext
│   ├── useApi.js                   # [NEW] Generic API call hook with loading/error
│   ├── useDebounce.js              # [MODIFY] Debounce utility
│   ├── usePagination.js            # [MODIFY] Pagination logic
│   └── usePermissions.js           # [MODIFY] Role-checking utilities
│
├── components/
│   ├── ui/
│   │   ├── Buttons.jsx             # [NEW] PrimaryBtn, GhostBtn (from prototype)
│   │   ├── FormComponents.jsx      # [NEW] FormField, WalletField, PanelField, etc.
│   │   ├── Cell.jsx                # [NEW] Cell, TableRow (from prototype)
│   │   ├── MiniTag.jsx             # [NEW] MiniTag (from prototype)
│   │   ├── Toggle.jsx              # [NEW] Toggle switch (from prototype)
│   │   ├── StatusBadge.jsx         # [NEW] Reusable status pill component
│   │   ├── SearchInput.jsx         # [NEW] Search input with icon
│   │   ├── FilterPills.jsx         # [NEW] Reusable filter pill group
│   │   ├── DataTable.jsx           # [NEW] Reusable table with header/rows/footer
│   │   ├── SlidePanel.jsx          # [NEW] Reusable slide-out panel wrapper
│   │   ├── Modal.jsx               # [NEW] Reusable modal wrapper
│   │   ├── Spinner.jsx             # [NEW] Loading spinner
│   │   └── EmptyState.jsx          # [NEW] Empty state placeholder
│   ├── icons/
│   │   └── Icons.jsx               # [NEW] All SVG icons (from prototype)
│   ├── common/
│   │   └── PageHeader.jsx          # [NEW] Reusable page header (title + subtitle)
│   └── layout/
│       ├── AppHeader.jsx           # [NEW] Top nav bar (brand + tabs + user)
│       ├── NavButton.jsx           # [NEW] Navigation tab button
│       └── UserBadge.jsx           # [NEW] User info display + sign out
│
├── layouts/
│   ├── AppLayout.jsx               # [MODIFY] Authenticated shell (header + content)
│   └── AuthLayout.jsx              # [MODIFY] Login page layout (dot grid bg)
│
├── routes/
│   ├── AppRoutes.jsx               # [MODIFY] Route definitions
│   ├── ProtectedRoute.jsx          # [MODIFY] Auth guard + role check
│   └── routeConfig.js              # [MODIFY] Route/nav config by role
│
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   └── LoginPage.jsx       # [NEW] Login screen (from LoginView)
│   │   └── api/
│   │       └── authApi.js          # [NEW] POST /api/auth/login, GET /api/me
│   │
│   ├── dashboard/
│   │   ├── pages/
│   │   │   └── CanteenDashboardPage.jsx  # [NEW] Manager/assistant dashboard
│   │   ├── components/
│   │   │   ├── ServiceStatusTiles.jsx    # [NEW] 4-service tile grid
│   │   │   ├── KpiStrip.jsx             # [NEW] KPI row
│   │   │   ├── PendingActions.jsx       # [NEW] Pending actions list
│   │   │   ├── QuickActions.jsx         # [NEW] Quick action buttons
│   │   │   ├── MenuPlanningStatus.jsx   # [NEW] Planning progress bars
│   │   │   ├── TomorrowMenu.jsx         # [NEW] Tomorrow's menu card
│   │   │   └── RecentBookings.jsx       # [NEW] Recent bookings card
│   │   └── api/
│   │       └── dashboardApi.js          # [NEW] Aggregated dashboard data
│   │
│   ├── menu/
│   │   ├── pages/
│   │   │   └── CatalogPage.jsx          # [NEW] Menu catalog (from CatalogView)
│   │   ├── components/
│   │   │   └── CreateMenuPanel.jsx      # [NEW] Slide-out create form
│   │   └── api/
│   │       └── menuApi.js               # [NEW] GET/POST /api/menu-items
│   │
│   ├── services/
│   │   ├── pages/
│   │   │   └── ServicesPage.jsx         # [NEW] Services list (from ServicesView)
│   │   └── api/
│   │       └── servicesApi.js           # [NEW] GET/POST/PUT /api/services
│   │
│   ├── dayslot/
│   │   ├── pages/
│   │   │   └── DaySlotsPage.jsx         # [NEW] Day slots list (from DaySlotsView)
│   │   └── api/
│   │       └── dayslotApi.js            # [NEW] GET/POST/PUT /api/day-slots
│   │
│   ├── daymenu/
│   │   ├── pages/
│   │   │   └── DayMenuPage.jsx          # [NEW] Day menu planning (from DayMenuView)
│   │   ├── components/
│   │   │   ├── DayMenuPanel.jsx         # [NEW] Schedule menu slide-out
│   │   │   ├── PendingApprovals.jsx     # [NEW] Pending approval cards
│   │   │   └── RemarksModal.jsx         # [NEW] Approve/reject modal
│   │   └── api/
│   │       └── daymenuApi.js            # [NEW] GET/POST/PATCH /api/day-menus
│   │
│   ├── pricing/
│   │   ├── pages/
│   │   │   └── PricingPage.jsx          # [NEW] Pricing config (from PricingView)
│   │   ├── components/
│   │   │   ├── PricingPanel.jsx         # [NEW] Create price slide-out
│   │   │   └── PriceConfigCard.jsx      # [NEW] Price config display card
│   │   └── api/
│   │       └── pricingApi.js            # [NEW] Pricing CRUD
│   │
│   ├── booking/
│   │   ├── pages/
│   │   │   ├── BookingsMonitorPage.jsx  # [NEW] Kitchen prod + audit (from BookingsMonitorView)
│   │   │   ├── PreBookingPage.jsx       # [NEW] Pre-booking (from PreBookingView)
│   │   │   └── MyBookingsPage.jsx       # [NEW] Employee bookings (from MyBookingsView)
│   │   ├── components/
│   │   │   ├── ProductionGrid.jsx       # [NEW] Kitchen production items
│   │   │   ├── BookingAuditTable.jsx    # [NEW] Booking records table
│   │   │   ├── PreBookingDateCard.jsx   # [NEW] Day card with meal slots
│   │   │   └── BookingSummaryBar.jsx    # [NEW] Sticky confirm bar
│   │   └── api/
│   │       └── bookingApi.js            # [NEW] GET/POST/PATCH /api/bookings, /api/menus
│   │
│   ├── wallet/
│   │   ├── pages/
│   │   │   ├── WalletPage.jsx           # [NEW] Admin wallet (from WalletView)
│   │   │   └── EmployeeWalletPage.jsx   # [NEW] Employee wallet (from EmployeeWalletView)
│   │   ├── components/
│   │   │   ├── TopUpForm.jsx            # [NEW] Top-up form
│   │   │   ├── WithdrawalTable.jsx      # [NEW] Withdrawal requests table
│   │   │   └── RejectModal.jsx          # [NEW] Reject withdrawal modal
│   │   └── api/
│   │       └── walletApi.js             # [NEW] /api/wallets/*
│   │
│   ├── common/
│   │   └── api/
│   │       └── commonApi.js             # [NEW] /api/common/* (status, customer-types)
│   │
│   └── identity/
│       └── api/
│           └── identityApi.js           # [NEW] /api/identity/* (future admin screens)
│
└── utils/
    ├── constants.js                # [MODIFY] Design tokens (T, NAV), status meta, role meta
    ├── currency.js                 # [MODIFY] Currency formatting
    ├── date.js                     # [MODIFY] Date formatting utilities
    └── formatters.js               # [MODIFY] General formatters
```

---

## 2. Prototype → Target Mapping

### Screen-by-Screen Mapping

| # | Prototype Screen | JSX Source File | Target Feature | Target Page/Component | Roles |
|---|---|---|---|---|---|
| 1 | **Login** | [`LoginView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/LoginView.jsx) | `auth` | `LoginPage.jsx` | All (unauthenticated) |
| 2 | **Dashboard Shell** | [`DashboardView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/DashboardView.jsx) | `layouts` | `AppLayout.jsx` + `AppHeader.jsx` | All (authenticated) |
| 3 | **Canteen Dashboard** | [`CanteenDashboardView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/CanteenDashboardView.jsx) | `dashboard` | `CanteenDashboardPage.jsx` | CTNMNG, CTNAST |
| 4 | **Employee Home** | (Removed) | `dashboard` | (Skipped - Redirect to Pre-Booking) | Employees |
| 5 | **Menu Catalog** | [`CatalogView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/CatalogView.jsx) | `menu` | `CatalogPage.jsx` + `CreateMenuPanel.jsx` | CTNMNG, CTNAST |
| 6 | **Services** | [`ServicesView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/ServicesView.jsx) | `services` | `ServicesPage.jsx` | CTNMNG, CTNAST |
| 7 | **Day Slots** | [`DaySlotsView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/DaySlotsView.jsx) | `dayslot` | `DaySlotsPage.jsx` | CTNMNG, CTNAST |
| 8 | **Day Menu Planning** | [`DayMenuView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/DayMenuView.jsx) | `daymenu` | `DayMenuPage.jsx` + subcomponents | CTNMNG, CTNAST |
| 9 | **Pricing** | [`PricingView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/PricingView.jsx) | `pricing` | `PricingPage.jsx` + subcomponents | CTNMNG only |
| 10 | **Bookings Monitor / Kitchen** | [`BookingsMonitorView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/BookingsMonitorView.jsx) | `booking` | `BookingsMonitorPage.jsx` | CTNMNG, CTNAST |
| 11 | **Pre-Booking** | [`PreBookingView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/PreBookingView.jsx) | `booking` | `PreBookingPage.jsx` | Employees |
| 12 | **My Bookings** | [`MyBookingsView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/MyBookingsView.jsx) | `booking` | `MyBookingsPage.jsx` | Employees |
| 13 | **Admin Wallet** | [`WalletView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/WalletView.jsx) | `wallet` | `WalletPage.jsx` | CTNMNG only |
| 14 | **Employee Wallet** | [`EmployeeWalletView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/EmployeeWalletView.jsx) | `wallet` | `EmployeeWalletPage.jsx` | Contract employees |
| 15 | **Reports** | [`ReportsView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/ReportsView.jsx) | `dashboard` | `ReportsPage.jsx` (placeholder) | CTNMNG only |
| 16 | **Account** | [`AccountView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/AccountView.jsx) | `dashboard` | `AccountPage.jsx` (placeholder) | CTNMNG, CTNAST |
| 17 | **Profile** | [`ProfileView.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/views/ProfileView.jsx) | `dashboard` | `ProfilePage.jsx` (placeholder) | Employees |

### Reusable UI Components Extraction

| Prototype Source | Target Component | Used By |
|---|---|---|
| [`Buttons.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Buttons.jsx) | `components/ui/Buttons.jsx` | Login, all forms |
| [`FormComponents.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/FormComponents.jsx) | `components/ui/FormComponents.jsx` | Catalog, DayMenu, Pricing, Wallet |
| [`Cell.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Cell.jsx) | `components/ui/Cell.jsx` | Catalog table |
| [`MiniTag.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/MiniTag.jsx) | `components/ui/MiniTag.jsx` | DayMenu table |
| [`Toggle.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Toggle.jsx) | `components/ui/Toggle.jsx` | DayMenu panel |
| [`Icons.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/icons/Icons.jsx) | `components/icons/Icons.jsx` | Throughout |
| [`tokens.js`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/constants/tokens.js) | `utils/constants.js` | Throughout |
| Inline `NavBtn` in DashboardView | `components/layout/NavButton.jsx` | AppHeader |
| Inline header in DashboardView | `components/layout/AppHeader.jsx` | AppLayout |

---

## 3. Backend API → Frontend Feature Mapping

### Authentication & Session

| Backend Endpoint | Method | Frontend Feature | Frontend Usage |
|---|---|---|---|
| `/api/auth/login` | POST | `auth` | Login form submission |
| `/api/auth/sso` | POST | `auth` | SSO login (if enabled) |
| `/api/me` | GET | `auth` | Fetch current user on app load / token refresh |

**Response shape from `/api/auth/login`:**
```js
{
  TOKEN: "jwt...",
  USER: {
    USERID, LOGINID, FULLNAME, EMAIL, MOBILENO, AUTHPROV,
    SYSTEMROLES: ["ADMIN", ...],
    CANTEENROLES: [{ CANTEENID, ROLECODE, ISDEFAULT }]
  },
  CUSTOMER: { CUSTOMERID, CTYPECODE, DISPNAME } | null
}
```

### Common / Master Data

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/common/status` | GET | Authenticated | Status codes for dropdowns |
| `/api/common/customer-types` | GET | Authenticated | Customer type dropdowns (Permanent, Contract, etc.) |

### Menu Management

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/menu-items` | GET | CTNMNG, CTNAST | `CatalogPage` — list all menu items |
| `/api/menu-items/:id` | GET | CTNMNG, CTNAST | Menu item detail |
| `/api/menu-items` | POST | CTNMNG, CTNAST | `CreateMenuPanel` — create menu item |
| `/api/menu-items/:id` | PUT | CTNMNG, CTNAST | Edit menu item |

### Services

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/services` | GET | CTNMNG, CTNAST | `ServicesPage` — list services |
| `/api/services` | POST | CTNMNG, CTNAST | Create service |
| `/api/services/:id` | PUT | CTNMNG, CTNAST | Update service |

### Day Slots

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/day-slots` | GET | CTNMNG, CTNAST | `DaySlotsPage` — list day slots |
| `/api/day-slots` | POST | CTNMNG, CTNAST | Create day slot |
| `/api/day-slots/:id` | PUT | CTNMNG, CTNAST | Update day slot |

### Day Menu

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/day-menus` | GET | CTNMNG, CTNAST | `DayMenuPage` — all scheduled menus |
| `/api/day-menus` | POST | CTNMNG, CTNAST | `DayMenuPanel` — schedule new entry |
| `/api/day-menus/:id/approve` | PATCH | CTNMNG | `RemarksModal` — approve pending entry |
| `/api/day-menus/:id/reject` | PATCH | CTNMNG | `RemarksModal` — reject pending entry |
| `/api/menus` | GET | Authenticated | `PreBookingPage` — published menus for booking |

### Bookings

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/bookings` | GET | Authenticated | `BookingsMonitorPage`, `MyBookingsPage` |
| `/api/bookings/:id` | GET | Authenticated | Booking detail |
| `/api/bookings` | POST | Authenticated | `PreBookingPage` — create booking |
| `/api/bookings/:id/cancel` | PATCH | Authenticated | Cancel booking |
| `/api/bookings/:id/serve` | PATCH | CTNMNG, CTNSTF | Serve booking |
| `/api/bookings/:id/no-show` | PATCH | CTNMNG, CTNSTF | Mark no-show |
| `/api/bookings/:id/items/:itemId/serve` | PATCH | CTNMNG, CTNSTF | Serve individual item |
| `/api/bookings/scan-rfid` | POST | CTNMNG, CTNSTF | RFID scan at kiosk |

### Wallet

| Backend Endpoint | Method | Roles | Frontend Feature |
|---|---|---|---|
| `/api/wallets` | POST | ADMIN, CTNMGR | Create wallet |
| `/api/wallets/topup` | POST | ADMIN, CTNMGR | `TopUpForm` — top up wallet |
| `/api/wallets/customer/:id` | GET | Authenticated | `EmployeeWalletPage` — balance |
| `/api/wallets/customer/:id/transactions` | GET | Authenticated | `EmployeeWalletPage` — transaction history |
| `/api/wallets/withdraw/request` | POST | Authenticated | Request withdrawal |
| `/api/wallets/withdraw/requests` | GET | ADMIN, CTNMGR | `WalletPage` — list pending requests |
| `/api/wallets/withdraw/:id/approve` | POST | ADMIN, CTNMGR | `WalletPage` — approve withdrawal |
| `/api/wallets/withdraw/:id/reject` | POST | ADMIN, CTNMGR | `RejectModal` — reject withdrawal |

### Pricing (pending access verification)

| Backend Endpoint (estimated) | Method | Roles | Frontend Feature |
|---|---|---|---|
| Pricing endpoints via `router.use("/", pricingRoutes)` | Various | CTNMNG | `PricingPage` |

---

## 4. Files to Create / Modify / Reuse

### Files to MODIFY (target already has skeleton)

| File | Current State | Action |
|---|---|---|
| [`App.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/App.jsx) | Placeholder `<h1>` | Wire AuthProvider + BrowserRouter + AppRoutes |
| [`main.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/main.jsx) | Standard Vite entry | Add Google Fonts link, keep as-is |
| [`index.css`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/index.css) | Empty (22 bytes) | Add reset, font imports, global styles |
| [`config/app.config.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/config/app.config.js) | Empty | Add API_BASE_URL, APP_NAME |
| [`config/axios.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/config/axios.js) | Empty | Create axios instance with Bearer interceptor |
| [`contexts/AuthContext.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/contexts/AuthContext.jsx) | Single import line | Full auth context (login, logout, user state, token) |
| [`hooks/useAuth.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/hooks/useAuth.js) | Empty | `useContext(AuthContext)` convenience hook |
| [`hooks/useDebounce.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/hooks/useDebounce.js) | Empty | Standard debounce hook |
| [`hooks/usePagination.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/hooks/usePagination.js) | Empty | Pagination state hook |
| [`hooks/usePermissions.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/hooks/usePermissions.js) | Empty | `hasCanteenRole()`, `isManager()`, etc. |
| [`layouts/AppLayout.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/layouts/AppLayout.jsx) | Empty | Header + `<Outlet />` shell |
| [`layouts/AuthLayout.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/layouts/AuthLayout.jsx) | Empty | Login page background layout |
| [`routes/AppRoutes.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/routes/AppRoutes.jsx) | Empty | Full route tree |
| [`routes/ProtectedRoute.jsx`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/routes/ProtectedRoute.jsx) | Empty | Auth + role guard |
| [`routes/routeConfig.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/routes/routeConfig.jsx) | Empty | Route definitions + nav config by role |
| [`utils/constants.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/utils/constants.js) | Empty | Design tokens, status meta, role meta |
| [`utils/currency.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/utils/currency.js) | Empty | `formatINR()` |
| [`utils/date.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/utils/date.js) | Empty | Date formatting helpers |
| [`utils/formatters.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/utils/formatters.js) | Empty | General formatters |

### Files to CREATE (new)

| File | Source | Description |
|---|---|---|
| `components/icons/Icons.jsx` | [JSX `Icons.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/icons/Icons.jsx) | All SVG icons |
| `components/ui/Buttons.jsx` | [JSX `Buttons.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Buttons.jsx) | PrimaryBtn, GhostBtn |
| `components/ui/FormComponents.jsx` | [JSX `FormComponents.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/FormComponents.jsx) | All form components |
| `components/ui/Cell.jsx` | [JSX `Cell.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Cell.jsx) | Table cell, TableRow |
| `components/ui/MiniTag.jsx` | [JSX `MiniTag.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/MiniTag.jsx) | Mini tag indicator |
| `components/ui/Toggle.jsx` | [JSX `Toggle.jsx`](file:///e:/CMS/Code/cms/frontend/Centralized%20login%20screen%20JSX/src/components/ui/Toggle.jsx) | Toggle switch |
| `components/ui/StatusBadge.jsx` | Extracted pattern | Reusable status pill |
| `components/ui/Spinner.jsx` | Extracted from Icons | Standalone spinner |
| `components/layout/AppHeader.jsx` | Extracted from DashboardView L93-143 | Navigation header |
| `components/layout/NavButton.jsx` | Extracted from DashboardView L73-91 | Nav tab button |
| `hooks/useApi.js` | New | API call hook |
| All `features/*/pages/*.jsx` | From corresponding prototype views | 15+ page components |
| All `features/*/components/*.jsx` | Extracted from large views | ~15 sub-components |
| All `features/*/api/*.js` | New | ~10 API modules |

### Files to DELETE

| File | Reason |
|---|---|
| `src/App.css` | Referenced in current App.jsx but unused; replaced by index.css |
| `features/dashboard/components` (empty file, 0 bytes) | Replace with proper directory |
| `features/dashboard/pages` (empty file, 0 bytes) | Replace with proper directory |

---

## 5. Recommended Implementation Order

### Phase 0: Foundation (must be done first)
1. **`index.css`** — Google Fonts (Inter, Space Grotesk), reset
2. **`utils/constants.js`** — Design tokens (`T`, `NAV`), `STATUS_META`, `ROLE_META`, `CUSTOMER_TYPES`, `BOOKING_STATUS_META`, `WITHDRAWAL_STATUS`, `PAYMENT_METHODS`
3. **`components/icons/Icons.jsx`** — All SVG icons
4. **`components/ui/*`** — All 7 base UI components (Buttons, FormComponents, Cell, MiniTag, Toggle, Spinner, StatusBadge)

### Phase 1: Auth & Routing Infrastructure
5. **`config/app.config.js`** — API base URL
6. **`config/axios.js`** — Axios instance with JWT interceptor
7. **`contexts/AuthContext.jsx`** — Full auth provider (login, logout, persist token, `/api/me`)
8. **`hooks/useAuth.js`** — Auth convenience hook
9. **`hooks/usePermissions.js`** — Role check utilities
10. **`features/auth/api/authApi.js`** — Login API call
11. **`layouts/AuthLayout.jsx`** — Login page background (dot grid, radial gradient)
12. **`features/auth/pages/LoginPage.jsx`** — Login form wired to real API
13. **`routes/ProtectedRoute.jsx`** — Auth guard
14. **`routes/routeConfig.js`** — Navigation config per role
15. **`components/layout/AppHeader.jsx`** — Top navigation bar
16. **`components/layout/NavButton.jsx`** — Nav tab component
17. **`layouts/AppLayout.jsx`** — Authenticated shell
18. **`routes/AppRoutes.jsx`** — Full route tree
19. **`App.jsx`** — Wire everything together

### Phase 2: Dashboards
20. **`features/dashboard/api/dashboardApi.js`** — Aggregate data calls
21. **`features/dashboard/pages/CanteenDashboardPage.jsx`** + sub-components

### Phase 3: Core Menu Management (CRUD screens)
23. **`features/common/api/commonApi.js`** — Master data
24. **`features/menu/api/menuApi.js`** — Menu CRUD
25. **`features/menu/pages/CatalogPage.jsx`** + `CreateMenuPanel.jsx`
26. **`features/services/api/servicesApi.js`** + `ServicesPage.jsx`
27. **`features/dayslot/api/dayslotApi.js`** + `DaySlotsPage.jsx`

### Phase 4: Day Menu Planning
28. **`features/daymenu/api/daymenuApi.js`** — Day menu CRUD + approve/reject
29. **`features/daymenu/pages/DayMenuPage.jsx`** + `DayMenuPanel.jsx` + `PendingApprovals.jsx` + `RemarksModal.jsx`

### Phase 5: Pricing
30. **`features/pricing/api/pricingApi.js`** — Pricing CRUD
31. **`features/pricing/pages/PricingPage.jsx`** + `PricingPanel.jsx` + `PriceConfigCard.jsx`

### Phase 6: Bookings
32. **`features/booking/api/bookingApi.js`** — Bookings + published menus
33. **`features/booking/pages/BookingsMonitorPage.jsx`** + sub-components
34. **`features/booking/pages/PreBookingPage.jsx`** + sub-components
35. **`features/booking/pages/MyBookingsPage.jsx`**

### Phase 7: Wallet
36. **`features/wallet/api/walletApi.js`** — Wallet CRUD
37. **`features/wallet/pages/WalletPage.jsx`** + `TopUpForm.jsx` + `WithdrawalTable.jsx` + `RejectModal.jsx`
38. **`features/wallet/pages/EmployeeWalletPage.jsx`**

### Phase 8: Placeholder Screens
39. **Reports, Account, Profile pages** — Static shells

---

## 6. Conflicts, Gaps, and Risks

### Backend Gaps

| Gap | Impact | Mitigation |
|---|---|---|
| **No dashboard aggregation endpoint** | `CanteenDashboardPage` needs KPIs (total bookings, served, remaining, no-shows per service per day). Currently the prototype computes this from mock data. | Frontend must compute from `GET /api/bookings?date=X` responses, or a dedicated dashboard endpoint should be added to the backend. |
| **No kitchen production endpoint** | `BookingsMonitorPage` shows aggregated "items to prepare / served / remaining" per menu item per service. The backend has no dedicated production summary endpoint. | Aggregate from booking data client-side, or add a `GET /api/bookings/production-summary?date=X` backend endpoint. |
| **No reporting endpoints** | `ReportsView` is a UI shell; backend has no report generation APIs. | Keep as static placeholder; add backend endpoints later. |
| **Pricing module inaccessible** | The `backend/src/modules/pricing/` directory returned permission denied. Cannot verify exact endpoints. | The route index imports `pricingRoutes` and mounts at `router.use("/", pricingRoutes)`. Need to verify once permissions are fixed. |
| **Published menus for pre-booking** | `GET /api/menus` exists (published menu route). Need to verify it returns data in the shape needed for the pre-booking date+slot+item grid. | Test the endpoint response shape against what `PreBookingPage` needs. |

### Role Mapping Conflicts

| Issue | Detail |
|---|---|
| **Prototype uses semantic role keys** | e.g., `canteen_manager`. Backend uses codes like `CTNMNG`. Must create a mapping layer in `utils/constants.js`. |
| **Dual role system** | Backend has both `SYSTEMROLES` (global, like `ADMIN`) and `CANTEENROLES` (scoped to a canteen, like `CTNMNG`). The prototype treats roles as flat. `usePermissions` must check **both** role arrays. |
| **No frontend role selection** | Per requirements: roles come from the backend JWT token. The frontend reads `CANTEENROLES` and `SYSTEMROLES` from the decoded token payload to determine navigation. |
| **Wallet role code mismatch** | Wallet routes use `ADMIN` and `CTNMGR` (system roles), while menu/service routes use `CTNMNG` and `CTNAST` (canteen roles). Different middleware (`authorizeSystemRoles` vs `authorizeAnyCanteenRole`). The permissions hook must handle both. |

### Prototype-to-Backend Data Shape Differences

| Prototype Shape | Backend Shape | Adaptation |
|---|---|---|
| `user.name` | `USER.FULLNAME` | Map in AuthContext |
| `user.employeeId` | `CUSTOMER.CUSTOMERID` or `USER.LOGINID` | Map in AuthContext |
| `user.role` (single string) | `SYSTEMROLES[]` + `CANTEENROLES[]` | Derive primary role for navigation |
| `user.dept` | Not in JWT — may need `/api/me` or identity endpoint | Fetch from `/api/me` on login |
| Menu item `status: "A"/"D"/"P"/"EXP"/"BLK"` | Likely matches backend status codes from `GET /api/common/status` | Verify against backend |
| Day menu `status: "PENDING"/"APPROVED"/"REJECTED"` | Backend uses `PATCH /:id/approve` and `/:id/reject` | Matches conceptually |
| Booking `status: "CR"/"SRV"/"CAN"/"NOS"/"PRT"` | Likely matches — backend has separate endpoints per status transition | Verify against backend booking model |

### Technical Risks

| Risk | Detail |
|---|---|
| **Tailwind conflict** | The project has Tailwind v4 installed but the prototype uses inline styles. Having both could cause style conflicts. Consider removing Tailwind or keeping it only for utility one-offs. |
| **react-router-dom v7** | The target uses react-router-dom v7 (latest). Route definitions should use the v7 API (`createBrowserRouter` or `<Routes>`/`<Route>` with `element` prop). |
| **Inline styles = no responsive design** | The prototype uses fixed pixel widths and grid columns. Some views (e.g., BookingsMonitor with 6-column grids) will not be mobile-friendly. Responsive breakpoints are a future concern. |
| **No WebSocket/real-time** | The backend has a `socket.js` utility but it's unclear if booking updates are pushed in real-time. The prototype refreshes data via state; the frontend should poll or listen for updates on the bookings/kitchen screens. |

---

## Verification Plan

### Automated Tests
- `npm run build` — verify the production build succeeds with no errors
- `npm run lint` — verify ESLint passes

### Manual Verification
- Login with backend credentials → verify JWT is stored and `/api/me` succeeds
- Navigate all tabs per role → verify role-based navigation works
- Create a menu item → verify `POST /api/menu-items` succeeds and list refreshes
- Schedule a day menu → verify `POST /api/day-menus` succeeds
- Approve/reject a day menu → verify `PATCH /api/day-menus/:id/approve|reject`
- Create a booking → verify `POST /api/bookings`
- Top up wallet → verify `POST /api/wallets/topup`
- Verify all screens match the JSX prototype visually
