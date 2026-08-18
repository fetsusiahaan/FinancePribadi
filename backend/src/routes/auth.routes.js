import { Router } from "express";
import { body } from "express-validator";
import {
  registerController,
  loginController,
  verifyTwoFactorController,
  setupTwoFactorController,
  confirmTwoFactorSetupController,
} from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  registerController
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginController
);

router.post(
  "/login/2fa-verify",
  [
    body("challenge_token").notEmpty().withMessage("Challenge token is required"),
    body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Code must be a 6-digit number"),
  ],
  verifyTwoFactorController
);

router.post(
  "/login/2fa-setup",
  [body("challenge_token").notEmpty().withMessage("Challenge token is required")],
  setupTwoFactorController
);

router.post(
  "/login/2fa-setup/confirm",
  [
    body("challenge_token").notEmpty().withMessage("Challenge token is required"),
    body("code").isLength({ min: 6, max: 6 }).isNumeric().withMessage("Code must be a 6-digit number"),
  ],
  confirmTwoFactorSetupController
);

export default router;
