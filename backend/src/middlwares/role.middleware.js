export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        SUCCESS: false,
        MESSAGE: "Authentication required",
      });
    }

    const userRoles = req.user.ROLES || [];

    const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        SUCCESS: false,
        MESSAGE: "You do not have permission to access this resource",
      });
    }

    next();
  };
};