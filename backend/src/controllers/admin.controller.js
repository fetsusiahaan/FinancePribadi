import * as adminService from "../services/admin.service.js";
import { checkValidation } from "../utils/validation.js";

export async function listUsersController(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size) || 20));
    const data = await adminService.listUsers({ page, pageSize, search: req.query.search || "" });
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function getUserDetailController(req, res, next) {
  try {
    const data = await adminService.getUserDetail(req.params.id);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function updateRoleController(req, res, next) {
  try {
    checkValidation(req);
    const data = await adminService.updateRole(req.userId, req.params.id, req.body.role);
    res.json({ status: "success", message: "Role updated", data });
  } catch (err) {
    next(err);
  }
}

export async function updateSuspendController(req, res, next) {
  try {
    checkValidation(req);
    const data = await adminService.updateSuspend(req.userId, req.params.id, req.body.is_suspended);
    res.json({ status: "success", message: "User status updated", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    await adminService.deleteUser(req.userId, req.params.id);
    res.json({ status: "success", message: "User deleted" });
  } catch (err) {
    next(err);
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const data = await adminService.resetPassword(req.params.id);
    res.json({ status: "success", message: "Password reset", data });
  } catch (err) {
    next(err);
  }
}
