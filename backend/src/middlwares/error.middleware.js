import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(
    {
      err,
      METHOD: req.method,
      URL: req.originalUrl,
    },
    "Unhandled application error"
  );

  // Handle MySQL custom SIGNAL exceptions
  if (err.code === 'ER_SIGNAL_EXCEPTION' || err.sqlState === '45000') {
    return res.status(400).json({
      SUCCESS: false,
      MESSAGE: err.message || "Business logic error",
    });
  }

  return res.status(err.statusCode || 500).json({
    SUCCESS: false,
    MESSAGE: err.message || "Internal server error",
  });
};