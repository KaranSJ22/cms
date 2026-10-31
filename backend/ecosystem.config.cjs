// ==========================================
// ISRO CMS — PM2 Ecosystem Configuration
// ==========================================
module.exports = {
  apps: [
    {
      name: "cms-backend",
      script: "src/server.js",
      // Inside a container, 1 instance managed by pm2-runtime is optimal.
      // Docker handles horizontal container replication.
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      // Timeout settings for graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
