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
app.use(express.json());

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
    customSiteTitle: "Finora AI — API Docs",
    swaggerOptions: { persistAuthorization: true, docExpansion: "list", tagsSorter: "alpha" },
  })
);

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

export default app;
