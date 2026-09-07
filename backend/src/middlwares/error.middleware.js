import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  const isOperational = err.isOperational || err.code === 'ER_SIGNAL_EXCEPTION' || err.sqlState === '45000' || err.code === 'ER_DUP_ENTRY' || (err.statusCode && err.statusCode < 500);
  
  let statusCode = err.statusCode || (isOperational ? 400 : 500);
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
  }

  const logPayload = {
    CORRELATION_ID: req.id || null,
    err: isOperational ? { message: err.message, name: err.name } : err,
    METHOD: req.method,
    URL: req.originalUrl,
  };

  if (isOperational) {
    logger.warn(logPayload, "Operational application error");
  } else {
    logger.error(logPayload, "Unhandled application error");
  }

  // Hide stack traces and genericize message in production for 500 errors
  const isProd = process.env.NODE_ENV === 'production';
  const message = isOperational ? err.message : (isProd ? "Internal server error" : err.message);

  return res.status(statusCode).json({
    SUCCESS: false,
    MESSAGE: message || "Business logic error",
    CORRELATION_ID: req.id || null,
  });
};