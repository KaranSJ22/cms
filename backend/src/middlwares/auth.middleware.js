import jwt from "jsonwebtoken";

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
      ROLES: decoded.ROLES || [],
      CUSTOMERID: decoded.CUSTOMERID || null,
      CTYPECODE: decoded.CTYPECODE || null,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      SUCCESS: false,
      MESSAGE: "Invalid or expired token",
    });
  }
};