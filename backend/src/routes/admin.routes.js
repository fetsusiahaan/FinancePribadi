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
  updateTierController,
  listPlanGrantsController,
  listPlansController,
} from "../controllers/admin.controller.js";
import { TIER_VALUES } from "../services/plan.constants.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

router.get("/overview", getOverviewController);
router.get("/system-health", getSystemHealthController);
router.get("/activity", listActivityController);
router.get("/users", listUsersController);

// Daftar akun berbayar. Terpisah dari /users karena yang dicari adalah irisan
// kecil (yang pernah di-grant), bukan halaman ke-sekian dari seluruh akun --
// dan /users tidak punya penyaringan tier sama sekali.
router.get("/plans", listPlansController);

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

// Pemberian tier manual. Inilah yang membuat sistem ini bisa dipakai sebelum
// ada payment gateway: admin menyetel tier setelah transfer masuk, dan
// plan_grants menyimpan siapa memberi apa, kapan, dengan catatan apa.
//
// TIDAK ada `expires_at` di sini, sengaja: masa berlaku PREMIUM adalah aturan
// produk (30 hari, PREMIUM_DURATION_DAYS) yang dihitung server, bukan angka yang
// boleh diketik pemanggil.
router.patch(
  "/users/:id/tier",
  [
    body("tier").isIn(TIER_VALUES).withMessage(`Tier must be one of ${TIER_VALUES.join(", ")}`),
    body("note").optional({ nullable: true }).isLength({ max: 200 }).withMessage("Note max 200 chars"),
  ],
  updateTierController
);

router.get("/users/:id/plan-grants", listPlanGrantsController);

router.delete("/users/:id", deleteUserController);

router.post("/users/:id/reset-password", resetPasswordController);

export default router;
