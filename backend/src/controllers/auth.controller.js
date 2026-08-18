import * as authService from "../services/auth.service.js";
import { checkValidation } from "../utils/validation.js";

export async function registerController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.register(req.body);
    res.status(201).json({ status: "success", message: "User registered successfully", data });
  } catch (err) {
    next(err);
  }
}

export async function loginController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.login(req.body);
    res.status(200).json({ status: "success", message: "Login successful", data });
  } catch (err) {
    next(err);
  }
}

export async function verifyTwoFactorController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.verifyLoginTwoFactor(req.body);
    res.status(200).json({ status: "success", message: "Login successful", data });
  } catch (err) {
    next(err);
  }
}

export async function setupTwoFactorController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.setupTwoFactor(req.body.challenge_token);
    res.status(200).json({ status: "success", message: "2FA setup initiated", data });
  } catch (err) {
    next(err);
  }
}

export async function confirmTwoFactorSetupController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.confirmTwoFactorSetup(req.body);
    res.status(200).json({ status: "success", message: "2FA enabled", data });
  } catch (err) {
    next(err);
  }
}
