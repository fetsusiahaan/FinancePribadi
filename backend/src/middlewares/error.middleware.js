import { logBackend } from "../utils/logger.js";

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logBackend(`${req.method} ${req.originalUrl} -> ${status} ${err.stack || err.message}`, true);
  res.status(status).json({ status: "error", message: err.message || "Internal server error" });
}
