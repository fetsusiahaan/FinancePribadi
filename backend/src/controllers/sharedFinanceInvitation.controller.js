import * as invitationService from "../services/sharedFinanceInvitation.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function getCurrentInvitation(req, res, next) {
  try {
    const data = await invitationService.getCurrent(req.membership);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function rotateInvitation(req, res, next) {
  try {
    checkValidation(req);
    const data = await invitationService.rotate(req.membership, req.body, getClientIp(req));
    res.status(201).json({ status: "success", message: "Invitation created", data });
  } catch (err) {
    next(err);
  }
}

export async function revokeInvitation(req, res, next) {
  try {
    await invitationService.revoke(req.membership, req.params.invitationId, getClientIp(req));
    res.json({ status: "success", message: "Invitation revoked" });
  } catch (err) {
    next(err);
  }
}

export async function validateInvitation(req, res, next) {
  try {
    checkValidation(req);
    const data = await invitationService.validate(req.body.code);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function previewInvitation(req, res, next) {
  try {
    checkValidation(req);
    const data = await invitationService.preview(req.query.code, req.userId);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function joinSharedFinance(req, res, next) {
  try {
    checkValidation(req);
    const data = await invitationService.join(req.userId, req.body.code, getClientIp(req));
    res.status(201).json({ status: "success", message: "Joined shared finance", data });
  } catch (err) {
    next(err);
  }
}
