import { Router } from "express";
import authRoutes from "./auth.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import categoryRoutes from "./category.routes.js";
import transactionRoutes from "./transaction.routes.js";
import budgetRoutes from "./budget.routes.js";
import userRoutes from "./user.routes.js";
import adminRoutes from "./admin.routes.js";
import { maybeCleanup } from "../services/cleanup.service.js";

const router = Router();

// Probe ringan buat klien (mobile ConnectionContext) cek backend hidup.
// Publik & tanpa DB call — supaya cepat dan gak ikut gagal saat DB lambat.
router.get("/health", (req, res) => {
  // Membonceng pembersihan refresh_tokens + activity_logs. TIDAK di-await dan
  // errornya tidak pernah naik ke sini: janji "tanpa DB call" di atas tetap
  // berlaku untuk RESPONS ini — sapuannya berjalan setelah res.json() dan
  // paling sering langsung keluar karena jedanya belum lewat.
  maybeCleanup();
  res.json({ status: "ok", uptime: process.uptime() });
});

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/categories", categoryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/users", userRoutes);
router.use("/admin", adminRoutes);

export default router;
