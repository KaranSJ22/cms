# ISRO CMS — Zero-Configuration Docker Quickstart

This setup runs the complete ISRO Canteen Management System on **Rocky Linux 9** with **PM2**, **Nginx**, and **MySQL 8.0** using Docker Compose.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS) or Docker Engine + Docker Compose v2 (Linux). Ensure Docker is running.

---

## 🚀 1-Step Setup & Launch

Clone the repository and launch the entire stack:

```bash
git clone https://github.com/KaranSJ22/cms.git
cd cms
docker compose up -d --build
```

That's it! Everything starts automatically in dependency order.

### What happens automatically:
1. **Database (`cms_db`):** Boots MySQL 8.0 on Rocky Linux 9, creates database `CMS_DB` and users.
2. **Auto-Initialization (`cms_init_db`):** Detects that the database is fresh and automatically deploys all schemas, 222+ stored procedures, scheduled events, and seed data.
3. **Backend (`cms_backend`):** Starts Node.js 20 under PM2 process management on Rocky Linux 9 once the database passes healthchecks.
4. **Frontend (`cms_frontend`):** Compiles the Vite React SPA and serves it through Nginx on Rocky Linux 9, reverse-proxying `/api` to the backend.

---

## 🌐 Accessing the Application

Once `docker compose up -d` finishes:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost](http://localhost) | Canteen Mitra web application |
| **Backend API Health** | [http://localhost/health](http://localhost/health) or [http://localhost:8080/health](http://localhost:8080/health) | API health check endpoint |
| **Database Health Check** | [http://localhost/health/db](http://localhost/health/db) | Live database connection verification |
| **API Documentation** | [http://localhost/api-docs](http://localhost/api-docs) | Interactive Swagger OpenAPI docs |
| **Database Server** | `localhost:3306` | MySQL server (`root` / `RootPassword@123`, DB: `CMS_DB`) |

---

## 🔑 Default Test Login Credentials

All seed accounts use the default password: **`admin123`**

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Full administrative access, user management, configuration |
| **Canteen Manager** | `mgr1` | `admin123` | Menu planning, day slots, pricing, official request approvals |
| **Canteen Assistant** | `asst1` | `admin123` | Meal serving counter, token validation |
| **Canteen Staff** | `staff1` | `admin123` | Kitchen prep, inventory, and counters |
| **Permanent Employee** | `perm1` | `admin123` | Employee booking, meal ordering, wallet topup |
| **Contract Employee** | `cont1` | `admin123` | Contract employee meal ordering and wallet |
| **Visitor / Guest** | `vis1` | `admin123` | Visitor temporary pass and walk-in meals |

---

## 🧪 Quick Verification & Testing Commands

Verify all services are running and healthy:

```bash
# 1. Check container health status
docker compose ps

# 2. Test Backend Health
curl http://localhost/health

# 3. Test Database Connectivity
curl http://localhost/health/db

# 4. View live logs of any service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

---

## 🛠️ Helpful Management Commands

### Check PM2 Status inside the Backend:
```bash
docker exec -it cms_backend pm2 list
docker exec -it cms_backend pm2 status
docker exec -it cms_backend pm2 logs
```

### Access MySQL Interactive Shell:
```bash
docker exec -it cms_db mysql -u root -pRootPassword@123 CMS_DB
```

### Stop the Stack:
```bash
docker compose down
```

*(Note: Database data is safely persisted across restarts in the `mysql_data` named Docker volume).*

### Reset Everything (Fresh Database Wipe):
```bash
docker compose down -v
docker compose up -d --build
```
