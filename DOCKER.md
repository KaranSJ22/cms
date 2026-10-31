# ISRO CMS — Zero-Configuration Docker Quickstart

This setup runs the complete ISRO Canteen Management System on **Rocky Linux 9** with **PM2**, **Nginx**, and **MySQL 8.0** using Docker Compose.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) or Docker Engine + Docker Compose v2 (Linux).

---

## 🚀 1-Step Setup

Clone the repository and launch the stack:

```bash
cd cms
docker compose up -d --build
```

### What happens automatically:
1. **Database (`cms_db`):** Boots MySQL 8.0 on Rocky Linux 9, creates database and users.
2. **Auto-Initialization (`cms_init_db`):** Detects that the database is fresh and automatically deploys all 48 tables, 222 stored procedures, scheduled events, and seed data.
3. **Backend (`cms_backend`):** Starts Node.js 20 under PM2 process management on Rocky Linux 9 once the database is fully ready.
4. **Frontend (`cms_frontend`):** Compiles the Vite React SPA and serves it through Nginx reverse proxy on Rocky Linux 9.

---

## 🌐 Accessing the Application

Once `docker compose up -d` finishes:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost](http://localhost) | Canteen Mitra web application |
| **Backend API Health** | [http://localhost/health](http://localhost/health) | API health check endpoint |
| **API Documentation** | [http://localhost/api-docs](http://localhost/api-docs) | Swagger OpenAPI docs |
| **Database Server** | `localhost:3306` | MySQL server (`root` / `RootPassword@123`) |

---

## 🛠️ Helpful Management Commands

### Check PM2 Status inside the Backend:
```bash
docker exec -it cms_backend pm2 list
docker exec -it cms_backend pm2 status
docker exec -it cms_backend pm2 logs
```

### View Live Logs:
```bash
# View backend logs
docker logs -f cms_backend

# View frontend / Nginx logs
docker logs -f cms_frontend

# View database logs
docker logs -f cms_db
```

### Stop the Containers:
```bash
docker compose down
```

*(Note: Database data is safely persisted in the `mysql_data` named Docker volume).*
