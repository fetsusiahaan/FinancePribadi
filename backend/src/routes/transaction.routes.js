import { Router } from "express";
import { body, param } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transaction.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listTransactions);

router.post(
  "/",
  [
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("date").isISO8601().withMessage("Date must be in YYYY-MM-DD format"),
    body("category_id").isUUID().withMessage("Valid category_id is required"),
    body("description").optional({ nullable: true }).isString(),
    body("is_recurring").optional().isBoolean(),
  ],
  createTransaction
);

router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid transaction id"),
    body("amount").optional().isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("date").optional().isISO8601().withMessage("Date must be in YYYY-MM-DD format"),
    body("category_id").optional().isUUID().withMessage("Valid category_id is required"),
    body("description").optional({ nullable: true }).isString(),
    body("is_recurring").optional().isBoolean(),
  ],
  updateTransaction
);

router.delete("/:id", [param("id").isUUID().withMessage("Invalid transaction id")], deleteTransaction);

export default router;
