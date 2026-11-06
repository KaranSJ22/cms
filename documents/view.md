# CanteenMitra - Canteen Management System for ISRO

CanteenMitra is an enterprise-grade canteen management system designed for ISRO centers. It provides advance meal pre-booking, multi-tiered customer pricing, menu planning, wallet management, official catering workflows, and paperless counter operations via RFID kiosks.

---

## Architecture and Container Setup

The entire central application runs in isolated Docker containers:

- **Frontend Container (`cms_frontend`):** React 19 SPA served via Nginx on port 80.
- **Backend Container (`cms_backend`):** Node.js Express 5 application running on port 8080 under PM2.
- **Database Container (`cms_db`):** MySQL 8.0 server running on port 3306, automatically migrated and seeded by the `cms_init_db` container on first startup.

---

## Tech Stack

| Component | Technology | Version | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | React | 19.2.8 | Single Page Application built with Vite 8 and TailwindCSS 4 |
| **Routing** | React Router DOM | 7.18.2 | Declarative client-side routing with role-based route guards |
| **Backend** | Express.js | 5.2.1 | REST API framework running on Node.js 18+ (ESM) |
| **Database** | MySQL | 8.0 | InnoDB storage engine with strict stored procedure boundary |
| **Database Driver** | mysql2/promise | 3.22.5 | Connection pool with parameterized stored procedure execution |
| **Validation** | Zod | 4.4.3 | Type-safe runtime schema validation for request payloads |
| **Authentication** | JWT & bcrypt | 9.0.3 / 6.0.0 | Stateless Bearer token verification and password hashing |
| **Logging** | Pino | 10.3.1 | Structured JSON application and HTTP request logging |
| **API Docs** | Swagger / OpenAPI | 5.0.1 / 6.3.0 | Interactive API documentation rendered at `/api-docs` |
| **Kiosk Subsystem**| Python & SQLite | 3.10+ / 11.8.1 | Raspberry Pi 5 RFID hardware daemon and offline edge agent |
| **DevOps** | Docker Compose | 24+ / v2+ | Multi-container stack running on Rocky Linux 9 base images |

---

## Quickstart: Run Project on Docker

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.0+
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/KaranSJ22/cms.git
cd cms
```

### 2. Start the Stack
Run the following command to build and launch all containers:
```bash
docker compose up -d --build
```

The database container will initialize, execute all schema migrations, create stored procedures, register scheduled events, and insert seed data automatically.

### 3. Application Access Points

| Service              | URL                        | Details                                 |
| :------------------- | :------------------------- | :-------------------------------------- |
| **Frontend Web App** | http://localhost           | Main user and administrative portal     |
| **Backend Health**   | http://localhost/health    | Service uptime probe                    |
| **Database Health**  | http://localhost/health/db | Live database connectivity verification |
| **Swagger API Docs** | http://localhost/api-docs  | Interactive OpenAPI documentation       |
| **MySQL Server**     | localhost:3306             | User: `root` / Pass: `RootPassword@123` |

### 4. Default Test Credentials
All test accounts are pre-configured with the default password: **`admin123`**

| Role                     | Username | Password   | Purpose                                                 |
| :----------------------- | :------- | :--------- | :------------------------------------------------------ |
| **System Administrator** | `admin`  | `admin123` | Center, canteen, role, and kiosk device administration  |
| **Canteen Manager**      | `mgr1`   | `admin123` | Menu planning, tariffs, day slots, and wallet top-ups   |
| **Permanent Employee**   | `perm1`  | `admin123` | Advance meal pre-booking and official catering requests |

### 5. Stopping the Stack
To stop all running containers:
```bash
docker compose down
```

To stop containers and remove persistent database volumes:
```bash
docker compose down -v
```

---

## Documentation Links

Complete project documentation is available in the repository:

- [System Architecture Overview](documents/architecture/system_overview.md) - End-to-end system topology, sequence diagrams, and module responsibilities.
- [Backend Architecture Specification](documents/architecture/backend-architecture.md) - Deep dive into backend layers, middleware pipeline, modules, and database gateway.
- [Frontend Architecture Specification](documents/architecture/frontend-architecture.md) - Feature-driven React architecture, route configurations, and state handling.
- [Database Architecture](documents/DATABASE_ARCHITECTURE.md) - Database schema organization, 25 normalized tables, views, and execution order.
- [ISRO CMS Project Specification](documents/ISRO_CMS_Project_Specification.md) - Authoritative organizational business rules, customer types, and requirements.
- [Docker Deployment Guide](DOCKER.md) - Detailed container instructions, production PM2 setup, and troubleshooting.
- [Offline Kiosk Architecture Plan](kiosk/offline_kiosk_architecture_plan.md) - Edge kiosk hardware driver, local SQLite cache, and outbox sync engine.

---
