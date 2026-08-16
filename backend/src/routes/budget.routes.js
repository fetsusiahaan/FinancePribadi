import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../controllers/budget.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listBudgets);

router.post(
  "/",
  [
    body("category_id").isUUID().withMessage("Valid category_id is required"),
    body("amount_limit").isFloat({ gt: 0 }).withMessage("amount_limit must be greater than 0"),
    body("month_year").isISO8601().withMessage("month_year must be in YYYY-MM-DD format"),
  ],
  createBudget
);

router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid budget id"),
    body("amount_limit").isFloat({ gt: 0 }).withMessage("amount_limit must be greater than 0"),
  ],
  updateBudget
);

router.delete("/:id", [param("id").isUUID().withMessage("Invalid budget id")], deleteBudget);

export default router;
