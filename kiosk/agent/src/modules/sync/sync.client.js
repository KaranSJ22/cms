import axios from "axios";
import { env } from "../../config/env.js";

export const centralClient = axios.create({
  baseURL: env.CENTRAL_API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    "X-Kiosk-Code": env.KIOSK_CODE,
    "X-Canteen-ID": String(env.CANTEEN_ID),
    ...(env.CENTRAL_API_KEY ? { Authorization: `Bearer ${env.CENTRAL_API_KEY}` } : {}),
  },
});
