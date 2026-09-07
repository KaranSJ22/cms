# CMS Frontend Architecture Report

## 1. Overview
The CMS Frontend (`cms-frontend`) is a modern Single Page Application (SPA) designed to interface with the Canteen Management System backend. It is built to support a diverse set of users including system administrators, canteen managers, operation staff, and consumers. The architecture emphasizes modularity, scalability, and strict role-based access control (RBAC).

## 2. Technology Stack
The application is built using a modern React ecosystem:
*   **Core Framework:** React v19
*   **Build Tool / Bundler:** Vite v8
*   **Routing:** React Router DOM v7
*   **Styling:** TailwindCSS v4 (configured via `@tailwindcss/vite` and PostCSS)
*   **HTTP Client:** Axios v1.19
*   **Code Quality:** ESLint

## 3. Architectural Pattern: Feature-Driven Design
The frontend avoids a traditional "type-based" folder structure (where all components, hooks, and services are grouped together globally). Instead, it adopts a **Feature-Driven Architecture**. 

Code is co-located by domain/feature, making the application highly maintainable as it scales. Each feature directory encapsulates its own components, hooks, API services, and utilities.

### Directory Structure
```text
cms-frontend/
├── src/
│   ├── assets/         # Static assets (images, icons)
│   ├── components/     # Global shared UI components (Buttons, Modals, Tables)
│   ├── config/         # Application configuration (API base URLs, constants)
│   ├── contexts/       # Global React Contexts (AuthContext, ThemeContext)
│   ├── features/       # Feature modules (Domain logic)
│   │   ├── auth/
│   │   ├── booking/
│   │   ├── common/
│   │   ├── dashboard/
│   │   ├── daymenu/
│   │   ├── dayslot/
│   │   ├── holidays/
│   │   ├── identity/
│   │   ├── kiosk/
│   │   ├── menu/
│   │   ├── menutemplates/
│   │   ├── pricing/
│   │   ├── reports/
│   │   ├── services/
│   │   └── wallet/
│   ├── hooks/          # Global custom React hooks
│   ├── layouts/        # Page layout wrappers
│   │   ├── AppLayout.jsx    # Main layout with Sidebar/Navbar
│   │   └── AuthLayout.jsx   # Minimal layout for Login/SSO
│   ├── routes/         # Route definitions and access control
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── routeConfig.js
│   ├── utils/          # Global utility functions (formatting, validation)
│   ├── App.jsx         # Root component
│   └── main.jsx        # Application entry point
```

## 4. State Management
*   **Global State:** Managed via React Context API (e.g., `AuthContext` for user session and role data).
*   **Server State (API):** Handled via Axios. Data fetching logic is encapsulated inside custom hooks within each feature module to abstract API calls away from UI components.
*   **Local State:** Standard `useState` and `useReducer` hooks.

## 5. Routing & Security (RBAC)
Routing is managed by `react-router-dom` using a declarative approach in `routes/routeConfig.js`.

### Authentication & Authorization
Security is enforced at the route level using a `ProtectedRoute` wrapper component.
*   **Authentication:** Verifies if a valid JWT token exists in local storage/context. If missing, the user is redirected to the Auth Layout (`/login`).
*   **Authorization:** The `ProtectedRoute` accepts an array of `allowedRoles`. It checks the logged-in user's role against this array. If the user lacks permissions, they are redirected to an "Unauthorized" or generic dashboard view.

## 6. Feature Modules Breakdown
The `features/` directory aligns 1:1 with the backend API modules:

*   **`auth`**: Login, SSO, token management.
*   **`identity`**: Admin user management, role assignments, customer profiles.
*   **`menu` / `services` / `dayslot` / `holidays`**: Core master data management for food items, timings, and inactive days.
*   **`menutemplates`**: Repeated menu scheduling and baseline definitions.
*   **`daymenu`**: Building, proposing, and approving the daily operational menus.
*   **`pricing`**: Managing historical and effective prices for different employee tiers.
*   **`booking`**: Consumer booking flow, RFID scanning, and serving logic.
*   **`kiosk`**: POS kiosk interfaces, fast scanning, and offline-first queueing mechanics.
*   **`wallet`**: Consumer balance displays, top-ups, and withdrawal approval flows.
*   **`reports`**: Aggregated views for kitchen prep (e.g. daily serving sheet) and sales summaries.
*   **`dashboard`**: Aggregated views tailored specifically to the logged-in user's role (Admin vs. Manager vs. Consumer).

## 7. UI/UX & Styling
*   **TailwindCSS v4:** Used extensively for rapid, utility-first styling.
*   **Responsive Design:** Layouts (`AppLayout`) and components are designed to be mobile-first, accommodating consumers on mobile devices and canteen staff on POS tablets.
*   **Component Modularity:** Complex pages are broken down into smaller, reusable components stored within their respective feature folders to prevent prop-drilling and massive file sizes.

