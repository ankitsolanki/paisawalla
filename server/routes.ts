import type { Express } from "express";
import { type Server } from "http";
// @ts-ignore
import { apiRouter, healthRouter, initializeBackend } from "./api/app.js";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(healthRouter);
  app.use("/api", apiRouter);

  initializeBackend();

  return httpServer;
}
