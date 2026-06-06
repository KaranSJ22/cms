import { env } from "./config/env.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import apiRoutes from "./routes/index.routes.js";
import { testDbConnection } from "./db/connection.js";
import { requestLogger } from "./middlwares/requestLogger.middleware.js";
import { errorHandler } from "./middlwares/error.middleware.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      SUCCESS: false,
      MESSAGE: "Too many login attempts. Please try again later.",
    },
  })
);

app.get("/health", (req, res) => {
  return res.status(200).json({
    SUCCESS: true,
    MESSAGE: "CMS backend is running",
    ENVIRONMENT: env.NODE_ENV,
  });
});

app.get("/health/db", async (req, res, next) => {
  try {
    const result = await testDbConnection();

    return res.status(200).json({
      SUCCESS: true,
      MESSAGE: "Database connection successful",
      DATA: result,
    });
  } catch (error) {
    next(error);
  }
});


app.use("/api", apiRoutes);

app.use((req, res) => {
  return res.status(404).json({
    SUCCESS: false,
    MESSAGE: "Route not found",
  });
});

app.use(errorHandler);

export default app;