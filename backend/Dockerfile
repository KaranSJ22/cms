# ==========================================
# ISRO CMS — Backend Dockerfile (Rocky Linux 9 + PM2)
# ==========================================
FROM rockylinux:9 AS base

WORKDIR /app

# 1. Install Node.js 20, native build tools (gcc, make, python3 for bcrypt), and curl
RUN dnf install -y --allowerasing curl && \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    dnf install -y nodejs make gcc-c++ python3 && \
    dnf clean all

# 2. Install PM2 globally to manage the Node.js application
RUN npm install -g pm2

# 3. Copy package descriptors and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit

# 4. Copy application source, startup scripts, PM2 config, and env template
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY ecosystem.config.cjs ./
COPY .env.example ./.env

# 5. Create non-root system user and configure PM2 directories
RUN groupadd -r cmsgroup && \
    useradd -r -g cmsgroup -m -d /home/cmsuser cmsuser && \
    mkdir -p /home/cmsuser/.pm2 && \
    chown -R cmsuser:cmsgroup /home/cmsuser /app

ENV PM2_HOME=/home/cmsuser/.pm2
USER cmsuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# pm2-runtime is designed specifically for containers (PID 1 in foreground, streams logs to stdout)
CMD ["pm2-runtime", "start", "ecosystem.config.cjs"]
