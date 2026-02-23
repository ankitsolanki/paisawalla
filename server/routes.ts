import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { storage } from "./storage";

const PAISAWALLA_BACKEND_PORT = 3001;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://127.0.0.1:${PAISAWALLA_BACKEND_PORT}`,
      changeOrigin: true,
      timeout: 30000,
      proxyTimeout: 30000,
      pathRewrite: undefined,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.path = `/api${req.url}`;
        },
        error: (err, _req, res) => {
          console.error("Proxy error:", err.message);
          if (res && "writeHead" in res && !res.headersSent) {
            (res as any).writeHead(502, { "Content-Type": "application/json" });
            (res as any).end(JSON.stringify({ message: "Backend service unavailable" }));
          }
        },
      },
    })
  );

  return httpServer;
}
