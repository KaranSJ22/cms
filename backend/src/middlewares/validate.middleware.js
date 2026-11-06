import { logger } from "../utils/logger.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const errorMessage =
        issues.map((e) => `${e.path?.join(".") || "field"}: ${e.message}`).join(", ") ||
        "Validation Error";

      // Log structured warning without dumping raw req.body (prevents credential/PII leaks)
      logger.warn(
        {
          CORRELATION_ID: req.id || null,
          METHOD: req.method,
          URL: req.originalUrl || req.url,
          issues: issues.map((e) => ({
            path: e.path?.join(".") || "field",
            message: e.message,
            code: e.code,
          })),
        },
        `Zod validation failed: ${errorMessage}`
      );

      return res.status(400).json({
        SUCCESS: false,
        MESSAGE: errorMessage,
        ERRORS: result.error?.flatten ? result.error.flatten() : result.error,
      });
    }

    req.validated = result.data;
    next();
  };
};