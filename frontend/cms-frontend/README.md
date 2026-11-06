# CanteenMitra Frontend (`cms-frontend`)

Single Page Application (SPA) for the Canteen Management System built for the Indian Space Research Organisation (ISRO).

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create a `.env` file from the provided example:
```bash
cp .env.example .env
```
Ensure `VITE_API_BASE_URL` is configured:
```env
VITE_API_BASE_URL=/api
```

### 3. Run Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`.

---

## Build and Code Quality

```bash
# Lint source code
npm run lint

# Compile production bundle to dist/
npm run build

# Preview production build locally
npm run preview
```

---

## Canonical Architecture Documentation

To avoid documentation fragmentation, the comprehensive architectural specifications, state management flows, RBAC guides, and design tokens are maintained in the central architecture repository:

* **Primary Architecture Specification:** [Frontend Architecture](file:///e:/CMS/Code/cms/documents/architecture/frontend-architecture.md)
* **Full System Overview:** [System Overview](file:///e:/CMS/Code/cms/documents/architecture/system-overview.md)
* **Backend Architecture:** [Backend Architecture](file:///e:/CMS/Code/cms/documents/architecture/backend-architecture.md)
* **Docker Deployment Guide:** [Docker Setup Guide](file:///e:/CMS/Code/cms/DOCKER.md)

Developed for ISRO Canteen Management System.
