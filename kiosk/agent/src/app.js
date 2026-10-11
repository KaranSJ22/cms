import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import apiRoutes from "./routes/index.routes.js";
import { requestLogger } from "./middlewares/requestLogger.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

const app = express();

app.set("trust proxy", true);
app.use(helmet());

const allowedOrigins = [
  ...((env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean)),
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || env.NODE_ENV === "development") {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Health check endpoint
app.get("/health", (req, res) => {
  return res.status(200).json({
    SUCCESS: true,
    MESSAGE: "CMS Kiosk Agent is running",
    ENVIRONMENT: env.NODE_ENV,
    KIOSK_CODE: env.KIOSK_CODE,
  });
});

// Mount API routes at /api
app.use("/api", apiRoutes);

// Serve static frontend build from public/ if present
const publicDir = path.resolve("public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api") || req.method !== "GET") {
      return next();
    }
    return res.sendFile(path.join(publicDir, "index.html"));
  });
}

// 404 Handler for API routes
app.use("/api", (req, res) => {
  return res.status(404).json({
    SUCCESS: false,
    MESSAGE: "Endpoint not found on local kiosk agent",
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
