export const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200
) => {
  return res.status(statusCode).json({
    SUCCESS: true,
    MESSAGE: message,
    DATA: data,
  });
};

export const sendError = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = null
) => {
  return res.status(statusCode).json({
    SUCCESS: false,
    MESSAGE: message,
    ERRORS: errors,
  });
};