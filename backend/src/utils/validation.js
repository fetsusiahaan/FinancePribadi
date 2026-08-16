import { validationResult } from "express-validator";

export function checkValidation(req) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const err = new Error(result.array()[0].msg);
    err.status = 400;
    throw err;
  }
}
