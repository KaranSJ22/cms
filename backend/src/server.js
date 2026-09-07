import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";


const server = app.listen(env.PORT, '0.0.0.0', () => {
  logger.info(`CMS backend server running on port ${env.PORT}`);
});

server.on('error', (err) => {
  logger.error({ err }, 'HTTP server error!');
  process.exit(1);
});


process.on("SIGINT", () => {
  logger.info("SIGINT received. Force shutting down server for fast restart...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Force shutting down server for fast restart...");
  process.exit(0);
});