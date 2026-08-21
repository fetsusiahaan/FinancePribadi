import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import {
  getOverviewController,
  getSystemHealthController,
  listActivityController,
  listUsersController,
  getUserDetailController,
  updateRoleController,
  updateSuspendController,
  deleteUserController,
  resetPasswordController,
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/overview", getOverviewController);
router.get("/system-health", getSystemHealthController);
router.get("/activity", listActivityController);
router.get("/users", listUsersController);
router.get("/users/:id", getUserDetailController);

router.patch(
  "/users/:id/role",
  [body("role").isIn(["USER", "ADMIN"]).withMessage("Role must be USER or ADMIN")],
  updateRoleController
);

router.patch(
  "/users/:id/suspend",
  [body("is_suspended").isBoolean().withMessage("is_suspended must be a boolean")],
  updateSuspendController
);

router.delete("/users/:id", deleteUserController);

router.post("/users/:id/reset-password", resetPasswordController);

export default router;
