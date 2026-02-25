import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };
  const config = viteConfig({mode: ""});

  const vite = await createViteServer({
    ...config,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  // Expose stable embed script URLs in dev to match production paths
  const embedEntries: Record<string, string> = {
    "/injectForm.js": "/src/embed/injectForm.js",
    "/injectAuth.js": "/src/embed/injectAuth.js",
    "/injectOffers.js": "/src/embed/injectOffers.js",
    "/injectFormWithAuth.js": "/src/embed/injectFormWithAuth.js",
  };

  for (const [publicPath, sourcePath] of Object.entries(embedEntries)) {
    app.get(publicPath, async (_req, res, next) => {
      try {
        const result = await vite.transformRequest(sourcePath);

        if (!result) {
          return next();
        }

        res
          .status(200)
          .setHeader("Content-Type", "application/javascript")
          .send(result.code);
      } catch (e) {
        next(e);
      }
    });
  }

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
