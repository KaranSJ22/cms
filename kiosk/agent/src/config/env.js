import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.string().default("info"),

  KIOSK_CODE: z.string().min(1).default("K1"),
  CANTEEN_ID: z.coerce.number().default(1),

  DB_PATH: z.string().default("./data/kiosk.db"),

  CENTRAL_API_BASE_URL: z.string().url().default("http://localhost:8080/api"),
  CENTRAL_API_KEY: z.string().optional().default(""),

  HEARTBEAT_INTERVAL_MS: z.coerce.number().default(15000),
  SYNC_INTERVAL_MS: z.coerce.number().default(15000),
  SYNC_BATCH_SIZE: z.coerce.number().default(25),

  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
