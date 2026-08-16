import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import categoryRoutes from "./category.routes.js";
import transactionRoutes from "./transaction.routes.js";
import budgetRoutes from "./budget.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);

export default router;
