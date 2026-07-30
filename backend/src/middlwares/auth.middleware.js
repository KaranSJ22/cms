import jwt from "jsonwebtoken";

const asStringArray = (value) =>
  Array.isArray(value)
    ? value.filter((item) => typeof item === "string")
    : [];

const asCanteenRoles = (value) =>
  Array.isArray(value)
    ? value
        .filter(
          (role) =>
            role &&
            Number.isInteger(Number(role.CANTEENID)) &&
            Number(role.CANTEENID) > 0 &&
            typeof role.ROLECODE === "string"
        )
        .map((role) => ({
          CANTEENID: Number(role.CANTEENID),
          ROLECODE: role.ROLECODE,
          ISDEFAULT: Boolean(role.ISDEFAULT),
        }))
    : [];

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        SUCCESS: false,
        MESSAGE: "Authentication token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      USERID: decoded.USERID,
      LOGINID: decoded.LOGINID,
      CUSTOMERID: decoded.CUSTOMERID || null,
      CTYPECODE: decoded.CTYPECODE || null,
      SYSTEMROLES: asStringArray(decoded.SYSTEMROLES),
      CANTEENROLES: asCanteenRoles(decoded.CANTEENROLES),
    };

    next();
  } catch (error) {
    return res.status(401).json({
      SUCCESS: false,
      MESSAGE: "Invalid or expired token",
    });
  }
};
