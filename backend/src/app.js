import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { logBackend } from "./utils/logger.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  res.on("finish", () => {
    logBackend(`${req.method} ${req.originalUrl} -> ${res.statusCode}`, res.statusCode >= 500);
  });
  next();
});

app.use("/api/v1", apiRoutes);

app.use(errorHandler);

export default app;
