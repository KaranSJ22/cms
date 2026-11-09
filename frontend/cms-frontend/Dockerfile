# ==========================================
# ISRO CMS — Frontend Multi-Stage Dockerfile (Rocky Linux 9)
# ==========================================

# ── Stage 1: Build Vite React SPA on Rocky Linux 9 ──
FROM rockylinux:9 AS builder

WORKDIR /app

# Install Node.js 20 and build tools
RUN dnf install -y --allowerasing curl && \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    dnf install -y nodejs make gcc-c++ && \
    dnf clean all

COPY package*.json ./
RUN npm ci

COPY . .

# Build production bundle (defaults to /api reverse-proxied by Nginx)
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ── Stage 2: Serve via Nginx on Rocky Linux 9 ──
FROM rockylinux:9

# Install Nginx and curl for healthcheck from Rocky 9 AppStream / EPEL
RUN dnf install -y epel-release && \
    dnf install -y --allowerasing nginx curl && \
    dnf clean all

# Copy custom Nginx configuration directly to master nginx.conf
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
