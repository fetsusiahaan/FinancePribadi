const express = require("express");
const path = require("path");
const http = require("http");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5173;
const BACKEND_HOST = "localhost";
const BACKEND_PORT = process.env.BACKEND_PORT || 5183;

// Setup directory logs
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log streams terpisah
const frontendLogStream = fs.createWriteStream(path.join(logsDir, "frontend.log"), { flags: "a" });
const frontendErrorStream = fs.createWriteStream(path.join(logsDir, "frontend-error.log"), { flags: "a" });
const backendLogStream = fs.createWriteStream(path.join(logsDir, "backend.log"), { flags: "a" });
const backendErrorStream = fs.createWriteStream(path.join(logsDir, "backend-error.log"), { flags: "a" });

function logFrontend(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(`[Frontend] ${message}`);
  frontendLogStream.write(logLine);
  if (isError) {
    frontendErrorStream.write(logLine);
  }
}

function logBackend(message, isError = false) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  console.log(`[Backend Proxy] ${message}`);
  backendLogStream.write(logLine);
  if (isError) {
    backendErrorStream.write(logLine);
  }
}

// Middleware untuk mencatat akses static files (Frontend)
app.use((req, res, next) => {
  if (!req.url.startsWith("/api")) {
    logFrontend(`${req.method} ${req.url}`);
  }
  next();
});

// Manual proxy untuk /api routes
app.use("/api", (req, res) => {
  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: {
      ...req.headers,
      host: BACKEND_HOST + ":" + BACKEND_PORT,
    },
  };

  logBackend(`Proxy Request: ${req.method} ${req.originalUrl}`);

  const proxyReq = http.request(options, (proxyRes) => {
    logBackend(`Proxy Response: ${req.method} ${req.originalUrl} -> Status ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    logBackend(`Proxy Error: ${req.method} ${req.originalUrl} -> ${err.message}`, true);
    res.status(502).json({
      error: "Backend server tidak dapat diakses",
      message: err.message,
    });
  });

  req.pipe(proxyReq);
});

// Static files (Vite build output)
app.use(express.static(path.join(__dirname, "frontend", "dist")));

// SPA fallback
app.get("/*splat", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

app.listen(PORT, () => {
  logFrontend(`Server Frontend running on http://localhost:${PORT}`);
  logBackend(`Proxy API active: http://localhost:${PORT}/api -> http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
