import { Router } from "express";
import { body, param, query } from "express-validator";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  requireMembership,
  requireNotArchived,
} from "../middlewares/sharedFinanceMembership.middleware.js";
import { P } from "../services/sharedFinance.constants.js";
import {
  listSharedFinances,
  createSharedFinance,
  getSharedFinance,
  updateSharedFinance,
  archiveSharedFinance,
  unarchiveSharedFinance,
  deleteSharedFinance,
  transferOwnership,
} from "../controllers/sharedFinance.controller.js";
import {
  listMembers,
  removeMember,
  leaveSharedFinance,
} from "../controllers/sharedFinanceMember.controller.js";
import {
  getCurrentInvitation,
  rotateInvitation,
  revokeInvitation,
  validateInvitation,
  previewInvitation,
  joinSharedFinance,
} from "../controllers/sharedFinanceInvitation.controller.js";
import {
  listSharedCategories,
  listSharedTransactions,
  createSharedTransaction,
  updateSharedTransaction,
  deleteSharedTransaction,
  getSharedSummary,
} from "../controllers/sharedTransaction.controller.js";

const router = Router();

router.use(requireAuth);

// Rangkaian requireMembership di bawah adalah matriks izin PRD_KB.md §4 dalam
// bentuk kode — kalau ada yang perlu diubah, ubah di sini, bukan di service.

const codeRule = body("code").isString().isLength({ min: 6, max: 32 }).withMessage("Kode tidak valid");

// ---------------------------------------------------------------------------
// PENTING: seluruh route berjalur tetap HARUS dideklarasikan SEBELUM "/:id".
// Express mencocokkan berurutan; kalau "/:id" duluan, "/categories" dan
// "/join/..." akan tertangkap sebagai id lalu ditolak param("id").isUUID()
// dengan 400 yang membingungkan.
// ---------------------------------------------------------------------------
router.get("/", listSharedFinances);

router.post(
  "/",
  [
    body("name").isString().trim().isLength({ min: 1, max: 100 }).withMessage("Nama wajib diisi"),
    body("description").optional({ nullable: true }).isString(),
    body("currency").optional().isString().isLength({ min: 3, max: 3 }),
  ],
  createSharedFinance
);

router.get("/categories", listSharedCategories);

router.post("/join/validate", [codeRule], validateInvitation);
router.get(
  "/join/preview",
  [query("code").isString().isLength({ min: 6, max: 32 })],
  previewInvitation
);
router.post("/join", [codeRule], joinSharedFinance);

// ---------------------------------------------------------------------------
// Per keuangan bersama
// ---------------------------------------------------------------------------
const idRule = param("id").isUUID().withMessage("Invalid shared finance id");

router.get("/:id", [idRule], requireMembership(P.VIEW), getSharedFinance);

router.patch(
  "/:id",
  [
    idRule,
    body("name").optional().isString().trim().isLength({ min: 1, max: 100 }),
    body("description").optional({ nullable: true }).isString(),
    body("currency").optional().isString().isLength({ min: 3, max: 3 }),
  ],
  requireMembership(P.MANAGE_SETTINGS),
  requireNotArchived,
  updateSharedFinance
);

router.post(
  "/:id/archive",
  [idRule],
  requireMembership(P.ARCHIVE_SHARED_FINANCE),
  archiveSharedFinance
);
router.post(
  "/:id/unarchive",
  [idRule],
  requireMembership(P.ARCHIVE_SHARED_FINANCE),
  unarchiveSharedFinance
);

router.delete(
  "/:id",
  [idRule, body("confirm_name").isString().withMessage("Ketik nama untuk konfirmasi")],
  requireMembership(P.DELETE_SHARED_FINANCE),
  deleteSharedFinance
);

// --- Anggota ---------------------------------------------------------------
// "/members/leave" sebelum "/members/:memberId" — alasan yang sama dengan blok
// jalur tetap di atas.
router.get("/:id/members", [idRule], requireMembership(P.VIEW), listMembers);
router.post("/:id/members/leave", [idRule], requireMembership(P.VIEW), leaveSharedFinance);
router.delete(
  "/:id/members/:memberId",
  [idRule, param("memberId").isUUID().withMessage("Invalid member id")],
  requireMembership(P.MANAGE_MEMBERS),
  removeMember
);

router.post(
  "/:id/transfer-ownership",
  [idRule, body("new_owner_user_id").isUUID().withMessage("new_owner_user_id wajib UUID")],
  requireMembership(P.TRANSFER_OWNERSHIP),
  requireNotArchived,
  transferOwnership
);

// --- Undangan --------------------------------------------------------------
router.get(
  "/:id/invitations/current",
  [idRule],
  requireMembership(P.MANAGE_MEMBERS),
  requireNotArchived,
  getCurrentInvitation
);
router.post(
  "/:id/invitations",
  [
    idRule,
    body("expires_in_minutes").optional().isInt({ min: 1, max: 10080 }),
    body("max_uses").optional({ nullable: true }).isInt({ min: 1, max: 1000 }),
  ],
  requireMembership(P.MANAGE_MEMBERS),
  requireNotArchived,
  rotateInvitation
);
router.delete(
  "/:id/invitations/:invitationId",
  [idRule, param("invitationId").isUUID().withMessage("Invalid invitation id")],
  requireMembership(P.MANAGE_MEMBERS),
  revokeInvitation
);

// --- Transaksi bersama -----------------------------------------------------
// EDIT_OWN/DELETE_OWN dipasang di sini supaya kedua role lolos; kepemilikan
// BARIS-nya diperiksa di sharedTransaction.service.js, karena itu bergantung
// pada datanya, bukan pada route-nya.
router.get("/:id/transactions", [idRule], requireMembership(P.VIEW), listSharedTransactions);

router.post(
  "/:id/transactions",
  [
    idRule,
    body("amount").isFloat({ gt: 0 }).withMessage("Amount must be greater than 0"),
    body("date").isISO8601().withMessage("Date must be in YYYY-MM-DD format"),
    body("type").isIn(["INCOME", "EXPENSE"]).withMessage("Type must be INCOME or EXPENSE"),
    body("category_id").optional({ nullable: true }).isUUID(),
    body("description").optional({ nullable: true }).isString(),
  ],
  requireMembership(P.CREATE_TRANSACTION),
  requireNotArchived,
  createSharedTransaction
);

router.put(
  "/:id/transactions/:txId",
  [
    idRule,
    param("txId").isUUID().withMessage("Invalid transaction id"),
    body("amount").optional().isFloat({ gt: 0 }),
    body("date").optional().isISO8601(),
    body("type").optional().isIn(["INCOME", "EXPENSE"]),
    body("category_id").optional({ nullable: true }).isUUID(),
    body("description").optional({ nullable: true }).isString(),
  ],
  requireMembership(P.EDIT_OWN_TRANSACTION),
  requireNotArchived,
  updateSharedTransaction
);

router.delete(
  "/:id/transactions/:txId",
  [idRule, param("txId").isUUID().withMessage("Invalid transaction id")],
  requireMembership(P.DELETE_OWN_TRANSACTION),
  requireNotArchived,
  deleteSharedTransaction
);

router.get("/:id/summary", [idRule], requireMembership(P.VIEW_REPORT), getSharedSummary);

export default router;
