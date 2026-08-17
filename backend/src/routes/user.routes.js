import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getMe, updateMe, changePassword, exportData, deleteMe } from "../controllers/user.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/me", getMe);

router.patch(
  "/me",
  [
    body("name").optional().isString().isLength({ min: 1 }).withMessage("Name cannot be empty"),
    body("phone").optional({ nullable: true }).isString(),
    body("profession").optional({ nullable: true }).isString(),
    body("income_range").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Income range must be >= 0"),
    body("risk_profile").optional({ nullable: true }).isString(),
    body("preferred_currency").optional().isIn(["IDR", "USD"]).withMessage("Preferred currency must be IDR or USD"),
  ],
  updateMe
);

router.put(
  "/me/password",
  [
    body("current_password").isString().isLength({ min: 1 }).withMessage("Current password is required"),
    body("new_password").isString().isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  ],
  changePassword
);

router.get("/me/export", exportData);

router.delete(
  "/me",
  [body("password").isString().isLength({ min: 1 }).withMessage("Password is required")],
  deleteMe
);

export default router;
