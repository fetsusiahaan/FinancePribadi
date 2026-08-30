import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  registerDeviceToken,
  unregisterDeviceToken,
} from "../controllers/deviceToken.controller.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  [body("token").isString().trim().notEmpty().withMessage("Token is required")],
  registerDeviceToken
);

router.delete(
  "/",
  [body("token").isString().trim().notEmpty().withMessage("Token is required")],
  unregisterDeviceToken
);

export default router;
