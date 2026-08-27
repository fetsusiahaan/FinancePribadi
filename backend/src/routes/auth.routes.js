import { Router } from "express";
import { body } from "express-validator";
import {
  registerController,
  loginController,
  googleAuthController,
  googleSignupCompleteController,
  verifyTwoFactorController,
  setupTwoFactorController,
  confirmTwoFactorSetupController,
  refreshController,
  logoutController,
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
  "/google",
  [body("id_token").notEmpty().withMessage("id_token is required")],
  googleAuthController
);

// Menutup alur pendaftaran Google: user baru baru benar-benar dibuat di sini,
// setelah password diisi. Tidak butuh Bearer token -- yang dipercaya adalah
// signup_token bertanda tangan dari POST /auth/google.
router.post(
  "/google/complete",
  [
    body("signup_token").notEmpty().withMessage("signup_token is required"),
    body("password").isString().isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  ],
  googleSignupCompleteController
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

router.post(
  "/refresh",
  [body("refresh_token").notEmpty().withMessage("Refresh token is required")],
  refreshController
);

router.post(
  "/logout",
  [body("refresh_token").notEmpty().withMessage("Refresh token is required")],
  logoutController
);

export default router;
