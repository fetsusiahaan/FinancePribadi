import { validationResult } from "express-validator";
import * as authService from "../services/auth.service.js";

function checkValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const err = new Error(result.array()[0].msg);
    err.status = 400;
    throw err;
  }
}

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
