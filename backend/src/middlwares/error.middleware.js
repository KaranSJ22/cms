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

  return res.status(err.statusCode || 500).json({
    SUCCESS: false,
    MESSAGE: err.message || "Internal server error",
  });
};