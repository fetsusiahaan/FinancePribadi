import { checkValidation } from "../utils/validation.js";
import { deviceTokenRepository } from "../repositories/deviceToken.repository.js";

export async function registerDeviceToken(req, res, next) {
  try {
    checkValidation(req);
    const { token } = req.body;
    await deviceTokenRepository.upsert(req.userId, token);
    res.json({ status: "success", message: "Device token registered" });
  } catch (err) {
    next(err);
  }
}

export async function unregisterDeviceToken(req, res, next) {
  try {
    checkValidation(req);
    const { token } = req.body;
    await deviceTokenRepository.deleteByToken(token);
    res.json({ status: "success", message: "Device token unregistered" });
  } catch (err) {
    next(err);
  }
}
