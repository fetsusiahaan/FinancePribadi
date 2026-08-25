import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getSummary, getCashflow, getRangeCashflow } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/summary", requireAuth, getSummary);
router.get("/cashflow", requireAuth, getCashflow);
// Dipisah dari /cashflow (deret bulanan) karena bentuk balikannya beda:
// endpoint ini membawa granularity + label sumbu, /cashflow tidak.
router.get("/cashflow/range", requireAuth, getRangeCashflow);

export default router;
