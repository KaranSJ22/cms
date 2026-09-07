export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const errorMessage = issues.map((e) => `${e.path?.join(".") || "field"}: ${e.message}`).join(", ") || "Validation Error";
      console.error("Zod Validation Error:", errorMessage, req.body);
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