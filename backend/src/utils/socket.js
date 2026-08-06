import { Server } from "socket.io";
import { logger } from "./logger.js";
import { env } from "../config/env.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Allow canteen staff interface to join a specific room for instant updates
    socket.on("join-canteen-dashboard", () => {
      socket.join("canteen_dashboard");
      logger.info(`Socket ${socket.id} joined room canteen_dashboard`);
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
