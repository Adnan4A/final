import dotenv from "dotenv";
dotenv.config();
const envResult = dotenv.config();

// Debug environment loading
console.log('Environment loading result:', envResult);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FIREBASE_SERVICE_ACCOUNT_KEY exists:', !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
console.log('TMDB_API_KEY exists:', !!process.env.TMDB_API_KEY);
console.log('VITE_FIREBASE_API_KEY exists:', !!process.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_PROJECT_ID exists:', !!process.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_APP_ID exists:', !!process.env.VITE_FIREBASE_APP_ID);

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Modified serveStatic behavior for production
    const staticPath = path.join(process.cwd(), "dist", "public");
    
    // Serve static assets (but not index.html automatically)
    app.use(express.static(staticPath, { index: false }));
    
    // Handle HTML requests with environment variable injection
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api')) {
        return next();
      }
      
      try {
        const indexPath = path.join(staticPath, 'index.html');
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Inject environment variables into the HTML for both TMDB and Firebase
        const envScript = `
          <script>
            window.__ENV__ = {
              VITE_TMDB_API_KEY: '${process.env.TMDB_API_KEY || process.env.VITE_TMDB_API_KEY || ''}',
              VITE_FIREBASE_API_KEY: '${process.env.VITE_FIREBASE_API_KEY || ''}',
              VITE_FIREBASE_PROJECT_ID: '${process.env.VITE_FIREBASE_PROJECT_ID || ''}',
              VITE_FIREBASE_APP_ID: '${process.env.VITE_FIREBASE_APP_ID || ''}'
            };
          </script>`;
        
        // Inject the script right after the opening <head> tag
        html = html.replace('<head>', `<head>${envScript}`);
        
        res.send(html);
      } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Server Error');
      }
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "localhost",
  }, () => {
    log(`serving on port ${port}`);
  });
})();