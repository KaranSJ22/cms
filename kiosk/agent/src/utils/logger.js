import pino from "pino";
import { env } from "../config/env.js";

const isProduction = env.NODE_ENV === "production";

let transport;
if (!isProduction) {
  try {
    await import("pino-pretty");
    transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    };
  } catch {
    // If pino-pretty is omitted (--omit=dev), fall back to standard JSON logging
  }
}

export const logger = pino({
  level: env.LOG_LEVEL,
  transport,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.PASSWORD",
      "body.token",
    ],
    censor: "[REDACTED]",
  },
});
