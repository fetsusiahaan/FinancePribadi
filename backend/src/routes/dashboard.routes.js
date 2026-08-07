import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getSummary } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", requireAuth, getSummary);

export default router;
