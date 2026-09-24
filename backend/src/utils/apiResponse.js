export const sendSuccess = (
  res,
  data = null,
  message = "Success",
  statusCode = 200,
  pagination = null
) => {
  const response = {
    SUCCESS: true,
    MESSAGE: message,
    DATA: data,
  };
  if (pagination !== null && pagination !== undefined) {
    response.PAGINATION = pagination;
  }
  return res.status(statusCode).json(response);
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