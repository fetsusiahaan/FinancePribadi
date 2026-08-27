import * as userService from "../services/user.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function getMe(req, res, next) {
  try {
    const data = await userService.getMe(req.userId);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    checkValidation(req);
    const data = await userService.updateMe(req.userId, req.body, getClientIp(req));
    res.json({ status: "success", message: "Profile updated", data });
  } catch (err) {
    next(err);
  }
}

export async function getAvatar(req, res, next) {
  try {
    const data = await userService.getAvatar(req.userId);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function updateAvatar(req, res, next) {
  try {
    checkValidation(req);
    const data = await userService.updateAvatar(req.userId, req.body.avatar, getClientIp(req));
    res.json({ status: "success", message: "Foto profil diperbarui", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteAvatar(req, res, next) {
  try {
    const data = await userService.deleteAvatar(req.userId, getClientIp(req));
    res.json({ status: "success", message: "Foto profil dihapus", data });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    checkValidation(req);
    const data = await userService.changePassword(req.userId, req.body);
    res.json({ status: "success", message: "Password updated", data });
  } catch (err) {
    next(err);
  }
}

export async function exportData(req, res, next) {
  try {
    const data = await userService.exportData(req.userId);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteMe(req, res, next) {
  try {
    checkValidation(req);
    await userService.deleteMe(req.userId, req.body);
    res.json({ status: "success", message: "Account deleted" });
  } catch (err) {
    next(err);
  }
}
