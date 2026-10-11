import { AppError } from "../common/errors/appError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || `err-${Date.now()}`;

  if (err instanceof AppError) {
    logger.warn({ correlationId, statusCode: err.statusCode, err: err.message }, err.message);
    return res.status(err.statusCode).json({
      SUCCESS: false,
      MESSAGE: err.message,
      CORRELATION_ID: correlationId,
    });
  }

  logger.error({ correlationId, err }, "Unhandled server error in kiosk agent");

  return res.status(500).json({
    SUCCESS: false,
    MESSAGE: env.NODE_ENV === "production" ? "Internal server error" : err.message,
    CORRELATION_ID: correlationId,
  });
};
