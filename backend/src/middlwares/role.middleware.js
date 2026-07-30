const sendForbidden = (res, message) =>
  res.status(403).json({
    SUCCESS: false,
    MESSAGE: message,
  });

export const authorizeSystemRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        SUCCESS: false,
        MESSAGE: "Authentication required",
      });
    }

    const userRoles = req.user.SYSTEMROLES || [];

    const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      return sendForbidden(res, "You do not have permission to access this resource");
    }

    next();
  };
};

const canteenIdFromRequest = (req) =>
  req.params?.canteenId ??
  req.validated?.params?.canteenId ??
  req.validated?.body?.CANTEENID ??
  req.validated?.query?.canteenId;

/**
 * Authorises an operational user for a specific canteen. Use this only after
 * the canteen ID has been established by a route parameter or trusted
 * resource lookup; never use a client-supplied body value for updates by ID.
 */

export const authorizeCanteenRoles = (
  allowedRoles,
  getCanteenId = canteenIdFromRequest
) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        SUCCESS: false,
        MESSAGE: "Authentication required",
      });
    }

    const canteenId = Number(getCanteenId(req));

    if (!Number.isInteger(canteenId) || canteenId <= 0) {
      return res.status(400).json({
        SUCCESS: false,
        MESSAGE: "A valid canteen ID is required for this operation",
      });
    }

    const hasAccess = (req.user.CANTEENROLES || []).some(
      (assignment) =>
        assignment.CANTEENID === canteenId &&
        allowedRoles.includes(assignment.ROLECODE)
    );

    if (!hasAccess) {
      return sendForbidden(res, "You are not assigned to this canteen for this operation");
    }

    req.canteenId = canteenId;
    next();
  };
};

export const authorizeAnyCanteenRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        SUCCESS: false,
        MESSAGE: "Authentication required",
      });
    }

    const hasAccess = (req.user.CANTEENROLES || []).some((assignment) =>
      allowedRoles.includes(assignment.ROLECODE)
    );

    if (!hasAccess) {
      return sendForbidden(res, "You do not have an operational canteen role");
    }

    next();
  };
};

// Compatibility name for routes that are strictly global/admin routes.
// New code should use authorizeSystemRoles explicitly.
export const authorizeRoles = authorizeSystemRoles;
