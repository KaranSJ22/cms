import pino from "pino";
import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

export const logger = pino({
  level: env.LOG_LEVEL,

  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.PASSWORD",
      "body.PASSWORDHASH",
      "body.token",
      "body.accessToken",
    ],
    censor: "[REDACTED]",
  },
});