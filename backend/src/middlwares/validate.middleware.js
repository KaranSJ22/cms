export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        SUCCESS: false,
        MESSAGE: "Validation failed",
        ERRORS: result.error.flatten(),
      });
    }

    req.validated = result.data;
    next();
  };
};