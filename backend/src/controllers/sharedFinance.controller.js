import * as sharedFinanceService from "../services/sharedFinance.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function listSharedFinances(req, res, next) {
  try {
    const { archived } = req.query;
    const data = await sharedFinanceService.list(req.userId, {
      archived: archived === undefined ? undefined : archived === "true",
    });
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function createSharedFinance(req, res, next) {
  try {
    checkValidation(req);
    const data = await sharedFinanceService.create(req.userId, req.body, getClientIp(req));
    res.status(201).json({ status: "success", message: "Shared finance created", data });
  } catch (err) {
    next(err);
  }
}

export async function getSharedFinance(req, res, next) {
  try {
    const data = await sharedFinanceService.getById(req.membership);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function updateSharedFinance(req, res, next) {
  try {
    checkValidation(req);
    const data = await sharedFinanceService.update(req.membership, req.body, getClientIp(req));
    res.json({ status: "success", message: "Shared finance updated", data });
  } catch (err) {
    next(err);
  }
}

export async function archiveSharedFinance(req, res, next) {
  try {
    const data = await sharedFinanceService.setArchived(req.membership, true, getClientIp(req));
    res.json({ status: "success", message: "Shared finance archived", data });
  } catch (err) {
    next(err);
  }
}

export async function unarchiveSharedFinance(req, res, next) {
  try {
    const data = await sharedFinanceService.setArchived(req.membership, false, getClientIp(req));
    res.json({ status: "success", message: "Shared finance unarchived", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteSharedFinance(req, res, next) {
  try {
    checkValidation(req);
    await sharedFinanceService.remove(req.membership, req.body, getClientIp(req));
    res.json({ status: "success", message: "Shared finance deleted" });
  } catch (err) {
    next(err);
  }
}

export async function transferOwnership(req, res, next) {
  try {
    checkValidation(req);
    const data = await sharedFinanceService.transferOwnership(
      req.membership,
      req.body,
      getClientIp(req)
    );
    res.json({ status: "success", message: "Ownership transferred", data });
  } catch (err) {
    next(err);
  }
}
