import { Router } from "express";
import { body, query } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { listCategories, createCategory } from "../controllers/category.controller.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  [query("type").optional().isIn(["INCOME", "EXPENSE"]).withMessage("type must be INCOME or EXPENSE")],
  listCategories
);

router.post(
  "/",
  requireAuth,
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("type").isIn(["INCOME", "EXPENSE"]).withMessage("type must be INCOME or EXPENSE"),
    body("icon").optional().isString(),
  ],
  createCategory
);

export default router;
