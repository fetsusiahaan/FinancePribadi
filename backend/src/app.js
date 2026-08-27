import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import apiRoutes from "./routes/index.js";
import { openApiSpec } from "./docs/openapi.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { logBackend } from "./utils/logger.js";
import { recordRequest, recordTimeout } from "./utils/metrics.js";

const app = express();

app.use(cors());
// Default express.json() cuma 100kb -- avatar base64 tanpa kompresi jauh
// melebihi itu dan akan ditolak sebagai 413 sebelum sampai ke handler.
// 12mb memberi ruang untuk batas 8mb di user.service.js plus overhead JSON,
// sehingga penolakan datang dari validasi kita (pesannya jelas) alih-alih dari
// body-parser (pesannya tidak).
app.use(express.json({ limit: "12mb" }));

app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    recordRequest(durationMs, res.statusCode);
    logBackend(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, res.statusCode >= 500);
  });

  req.on("close", () => {
    if (!res.writableEnded) recordTimeout();
  });

  next();
});

// Spec mentah — buat di-import Postman/Insomnia atau codegen client.
app.get("/api/docs.json", (req, res) => res.json(openApiSpec));

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    customSiteTitle: "Finetra AI — API Docs",
    swaggerOptions: { persistAuthorization: true, docExpansion: "list", tagsSorter: "alpha" },
  })
);

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

export default app;
