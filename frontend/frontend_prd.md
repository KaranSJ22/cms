# Product Requirements Document (PRD): Canteen Management System (Frontend)

## 1. Product Overview
The Canteen Management System (CMS) Frontend is a web application designed to digitize and streamline corporate canteen operations. It serves multiple stakeholders, from end-consumers booking meals to administrative staff managing menus, wallets, and daily operations. This document outlines the required screens, features, and API integrations based strictly on the backend architecture.

## 2. User Roles & Access Control
The application uses a Role-Based Access Control (RBAC) system. The frontend must parse the user's role from the authentication token and conditionally render navigation and pages.

*   **ADMIN**: System administrator managing identity, master data, and overall system health.
*   **CTNMGR (Canteen Manager)**: High-level operational manager handling approvals, wallet finances, and overarching menu configurations.
*   **CTNAST (Canteen Assistant)**: Operational staff who assist in preparing menus, slots, and pricing (requires Manager approval for finalization).
*   **CTNSTF (Canteen Staff)**: Front-line staff working at the canteen counters serving food.
*   **CONSUMER**: Regular employees/users who book meals and manage their digital wallets.

---

## 3. Module Requirements & Screen Specifications

### 3.1 Common / Global Module
**Accessible by:** All Users (Unauthenticated & Authenticated)

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **Login / SSO Page** | • Standard email/password login form.<br>• Single Sign-On (SSO) button.<br>• Securely store JWT token upon success.<br>• Redirect based on role. | `POST /auth/login`<br>`POST /auth/sso` |
| **Dashboard (Role-based)** | • A dynamic landing page that displays widgets relevant to the logged-in user's role (e.g., Consumer sees upcoming bookings; Manager sees daily meal stats). | N/A (Frontend aggregation) |

---

### 3.2 System Admin Module
**Accessible by:** `ADMIN`

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **User Management** | • Data table listing all users.<br>• Action to create a new user (Form).<br>• Action to assign/update user roles. | `GET /identity/users`<br>`POST /identity/users`<br>`POST /identity/user-roles` |
| **Customer Directory** | • Data table listing all customers/employees.<br>• Action to register new customers. | `GET /identity/customers`<br>`POST /identity/customers` |
| **Master Configs** | • View system roles, UI screen configurations, and auto-numbering rules in a tabbed interface. | `GET /identity/roles`<br>`GET /common/screens`<br>`GET /common/autonos` |

---

### 3.3 Canteen Management Module
**Accessible by:** `CTNMGR`, `CTNAST` *(Note: Approvals restricted to CTNMGR)*

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **Master Menu Management** | • CRUD interface for core food items.<br>• Form to add item details (name, category, veg/non-veg). | `GET`, `POST`, `PUT /menu` |
| **Service Configuration** | • Define meal services (Breakfast, Lunch, Dinner).<br>• Table view with edit capabilities. | `GET`, `POST`, `PUT /service` |
| **Day Slot Management** | • Configure time slots (e.g., 12:00 PM - 1:00 PM).<br>• Link slots to specific services. | `GET`, `POST`, `PUT /dayslot` |
| **Pricing Management** | • Interface to set prices for menu items.<br>• View historical pricing trends.<br>• Ability to deactivate outdated prices. | `POST /pricing/menu-items/:id/prices`<br>`GET /pricing/menu-items/:id/prices`<br>`PATCH /pricing/item-prices/:id/deactivate` |
| **Day Menu Planning** | • Calendar/List view to build menus for specific dates.<br>• Assistant can draft (`POST`); Manager can review and approve (`PATCH /approve`) or reject (`PATCH /reject`). | `GET`, `POST /daymenu`<br>`PATCH /daymenu/:id/approve`<br>`PATCH /daymenu/:id/reject` |

---

### 3.4 Finance & Wallet Administration
**Accessible by:** `ADMIN`, `CTNMGR`

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **Wallet Management** | • Search and create employee wallets.<br>• Process manual top-ups for users (cash deposits). | `POST /wallet/`<br>`POST /wallet/topup` |
| **Withdrawal Approvals** | • Dashboard showing pending withdrawal requests from users.<br>• Approve or Reject action buttons with confirmation modals. | `GET /wallet/withdraw/requests`<br>`POST /wallet/withdraw/:id/approve`<br>`POST /wallet/withdraw/:id/reject` |

---

### 3.5 Counter / POS Service Module
**Accessible by:** `CTNMGR`, `CTNSTF`

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **Service POS Interface** | • High-visibility, fast-acting interface for tablet/desktop.<br>• Input field to scan RFID/Barcodes.<br>• Show booking details upon scan.<br>• "Serve All" or "Serve specific items" buttons.<br>• "Mark No-Show" button for absentees. | `POST /booking/scan-rfid`<br>`PATCH /booking/:id/serve`<br>`PATCH /booking/:id/items/:itemId/serve`<br>`PATCH /booking/:id/no-show` |
| **Kiosk Management** | • Toggle switch to enable/disable self-service kiosks for a specific Day Menu. | `PATCH /booking/kiosk-toggle/:dayMenuId` |

---

### 3.6 Consumer Module (Self-Service)
**Accessible by:** All Authenticated Users (`CONSUMER` minimum)

| Page/Screen | Features & Requirements | Backend API Integration |
| :--- | :--- | :--- |
| **Meal Booking Portal** | • Calendar or Daily Card view showing published menus.<br>• Display effective prices based on the user's tier.<br>• Cart/Checkout flow to finalize bookings.<br>• Edit pending items or cancel upcoming bookings. | `GET /daymenu/publishedMenuRoutes`<br>`GET /pricing/menu-items/.../effective`<br>`POST`, `PUT`, `PATCH /booking` |
| **My Bookings History** | • List of past and upcoming bookings with status (Served, Cancelled, Pending).<br>• Click to view detailed e-receipt. | `GET /booking`<br>`GET /booking/:id` |
| **My Wallet** | • Display current balance prominently.<br>• Ledger table showing all top-ups and deductions.<br>• Form to request a wallet withdrawal. | `GET /wallet/customer/:customerId`<br>`GET /wallet/customer/:customerId/transactions`<br>`POST /wallet/withdraw/request` |

## 4. Technical Constraints & UI/UX Guidelines
1.  **Authentication:** All requests (except login) must include the Bearer token in the `Authorization` header.
2.  **API Error Handling:** The frontend must gracefully handle 401 (Unauthorized) and 403 (Forbidden) errors by redirecting to the login page or showing "Access Denied" screens respectively.
3.  **Validation:** Frontend forms must mirror backend validation schemas to prevent unnecessary API calls.
4.  **Responsive Design:** The Consumer and Canteen Staff (POS) interfaces must be highly responsive (mobile/tablet friendly). Admin/Manager views can be optimized for desktop.
