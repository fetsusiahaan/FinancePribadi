import * as userService from "../services/user.service.js";
import { checkValidation } from "../utils/validation.js";

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
    const data = await userService.updateMe(req.userId, req.body);
    res.json({ status: "success", message: "Profile updated", data });
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
