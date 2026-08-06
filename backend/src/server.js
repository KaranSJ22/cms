import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { initSocket } from "./utils/socket.js";

const server = app.listen(env.PORT, () => {
  logger.info(`CMS backend server running on port ${env.PORT}`);
});

initSocket(server);

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down server...");
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down server...");
  server.close(() => {
    logger.info("Server closed successfully");
    process.exit(0);
  });
});