import * as authService from "../services/auth.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

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
    const data = await authService.login(req.body, getClientIp(req));
    res.status(200).json({ status: "success", message: "Login successful", data });
  } catch (err) {
    next(err);
  }
}

export async function googleAuthController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.loginWithGoogle(req.body, getClientIp(req));
    const message = data.status === "signup_required" ? "Registration required" : "Login successful";
    res.status(200).json({ status: "success", message, data });
  } catch (err) {
    next(err);
  }
}

export async function googleSignupCompleteController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.completeGoogleSignup(req.body, getClientIp(req));
    res.status(201).json({ status: "success", message: "User registered successfully", data });
  } catch (err) {
    next(err);
  }
}

export async function verifyTwoFactorController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.verifyLoginTwoFactor(req.body, getClientIp(req));
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

export async function refreshController(req, res, next) {
  try {
    checkValidation(req);
    const data = await authService.refreshAccessToken(req.body.refresh_token);
    res.status(200).json({ status: "success", message: "Token refreshed", data });
  } catch (err) {
    next(err);
  }
}

export async function logoutController(req, res, next) {
  try {
    checkValidation(req);
    await authService.logout(req.body.refresh_token);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
