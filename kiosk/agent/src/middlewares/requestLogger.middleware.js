import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  // Suppress chatter for frequent health checks
  if (req.url === "/health" || req.url === "/api/kiosk/health") {
    return next();
  }

  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      {
        method: req.method,
        url: req.originalUrl || req.url,
        status: res.statusCode,
        durationMs: duration,
      },
      `${req.method} ${req.originalUrl || req.url} ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};
