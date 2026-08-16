import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getSummary, getCashflow } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", requireAuth, getSummary);
router.get("/cashflow", requireAuth, getCashflow);

export default router;
