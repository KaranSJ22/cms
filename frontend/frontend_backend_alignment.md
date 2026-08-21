# Frontend ↔ Backend Alignment Report

## Summary

Overall the frontend is **well-aligned** with the backend. Every backend module has a corresponding frontend feature folder, every API route has a matching frontend call, and the HTTP verbs/paths are consistent. However there are **3 issues** that need attention — one critical, one moderate, and one minor.

---

## ❌ Issue 1 — Port Mismatch (CRITICAL)

| Side | Value |
|---|---|
| Backend `PORT` (`.env`) | **8080** |
| Frontend `API_BASE_URL` (`app.config.js`) | `http://localhost:3000/api` (default) |
| Backend CORS `FRONTEND_URL` | `http://localhost:3000` |

The backend listens on **port 8080**, but the frontend default base URL points to **port 3000**. This means all API calls will fail unless `VITE_API_BASE_URL` is set in a `.env` file for the frontend.

> [!CAUTION]
> Create `frontend/cms-frontend/.env` with:
> ```
> VITE_API_BASE_URL=http://localhost:8080/api
> ```
> The backend CORS also allows `http://localhost:3000` as the frontend origin — that is fine for the Vite dev server default port (5173 by default with Vite, or 3000 if configured). Confirm the Vite dev server port matches `FRONTEND_URL` in the backend `.env`.

---

## ⚠️ Issue 2 — Missing `identityApi.js` (MODERATE)

The backend has a full `identity` module with 6 endpoints:

| Method | Path |
|---|---|
| `GET` | `/api/identity/users` |
| `POST` | `/api/identity/users` |
| `POST` | `/api/identity/user-roles` |
| `GET` | `/api/identity/roles` |
| `GET` | `/api/identity/customers` |
| `POST` | `/api/identity/customers` |

The frontend `features/identity/api/` folder exists but is **empty** — no `identityApi.js` file. Any UI that needs to manage users, roles, or customers currently has no API layer.

> [!WARNING]
> Create `src/features/identity/api/identityApi.js` covering all 6 endpoints above.

---

## ⚠️ Issue 3 — Missing `updateBookingItem` in Frontend (MODERATE)

The backend has:
```
PUT /api/bookings/:id/items/:itemId
```
The frontend [`bookingApi.js`](file:///e:/CMS/Code/cms/frontend/cms-frontend/src/features/booking/api/bookingApi.js) covers every other booking endpoint **except** this one.

> [!WARNING]
> Add `updateBookingItem(id, itemId, body)` to `bookingApi.js`.

---

## ✅ Fully Aligned Modules

| Feature | Backend Route Prefix | Frontend API File | Status |
|---|---|---|---|
| Auth | `/api/auth` | `authApi.js` | ✅ All endpoints match |
| Common | `/api/common` | `commonApi.js` | ✅ All endpoints match |
| Services | `/api/services` | `servicesApi.js` | ✅ All endpoints match |
| Menu Items | `/api/menu-items` | `menuApi.js` | ✅ All endpoints match |
| Pricing | `/api/menu-items/:id/prices` + `/api/item-prices` | `pricingApi.js` | ✅ All 5 endpoints match |
| Day Slots | `/api/day-slots` | `dayslotApi.js` | ✅ All endpoints match |
| Day Menus | `/api/day-menus` + `/api/menus` | `daymenuApi.js` | ✅ All endpoints match, incl. published menus |
| Bookings | `/api/bookings` | `bookingApi.js` | ⚠️ Missing `updateBookingItem` |
| Wallet | `/api/wallets` | `walletApi.js` | ✅ All 8 endpoints match |
| Identity | `/api/identity` | *(empty)* | ❌ No API file |

---

## ✅ Axios / Auth Wiring

- JWT is attached via `Authorization: Bearer <token>` interceptor — matches backend `auth.middleware.js`.
- 401 response interceptor clears token and redirects to `/login` — correct.
- `withCredentials: false` is consistent with the backend not using cookies.
- Response shape `res.data.DATA` correctly matches the backend's `{ SUCCESS, MESSAGE, DATA }` envelope.

---

## ✅ Route Guards

- `ProtectedRoute` with `requirePermission` is used for `/pricing` and `/wallet` — aligns with backend `ADMIN/CTNMGR` role guards.
- No identity management page route exists in `AppRoutes.jsx` — consistent with the missing `identityApi.js` (the feature is simply not yet built in the frontend).

---

## Action Items

| Priority | Task |
|---|---|
| 🔴 Critical | Create `frontend/cms-frontend/.env` with `VITE_API_BASE_URL=http://localhost:8080/api` |
| 🟡 Moderate | Create `src/features/identity/api/identityApi.js` |
| 🟡 Moderate | Add `updateBookingItem` to `bookingApi.js` |
