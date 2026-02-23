import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { spawn } from "child_process";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
      startPaisawallaBackend();
    },
  );
})();

let backendRestartCount = 0;
const MAX_BACKEND_RESTARTS = 10;
let currentBackendChild: ReturnType<typeof spawn> | null = null;

process.on("exit", () => {
  if (currentBackendChild) currentBackendChild.kill();
});

function startPaisawallaBackend() {
  const backendPort = "3001";
  const backendCwd = `${process.cwd()}/paisawalla/backend`;

  const env = {
    ...process.env,
    PORT: backendPort,
    NODE_ENV: process.env.NODE_ENV || "development",
    CORS_ORIGIN: `http://localhost:5000,http://0.0.0.0:5000`,
  };

  const child = spawn("node", ["src/app.js"], {
    cwd: backendCwd,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  currentBackendChild = child;

  child.stdout?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) log(msg, "paisawalla-backend");
  });

  child.stderr?.on("data", (data: Buffer) => {
    const msg = data.toString().trim();
    if (msg) log(msg, "paisawalla-backend");
  });

  child.on("error", (err) => {
    log(`Failed to start paisawalla backend: ${err.message}`, "paisawalla-backend");
  });

  child.on("exit", (code, signal) => {
    if (code === 0) {
      backendRestartCount = 0;
    }
    backendRestartCount++;
    if (backendRestartCount <= MAX_BACKEND_RESTARTS) {
      log(`Paisawalla backend exited (code=${code}, signal=${signal}). Restarting in 3s... (attempt ${backendRestartCount}/${MAX_BACKEND_RESTARTS})`, "paisawalla-backend");
      setTimeout(() => startPaisawallaBackend(), 3000);
    } else {
      log(`Paisawalla backend exceeded max restarts (${MAX_BACKEND_RESTARTS}). Not restarting.`, "paisawalla-backend");
    }
  });
}
