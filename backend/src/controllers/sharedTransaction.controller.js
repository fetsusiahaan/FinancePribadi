import * as sharedTransactionService from "../services/sharedTransaction.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function listSharedCategories(req, res, next) {
  try {
    const data = await sharedTransactionService.listCategories(req.query.type);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function listSharedTransactions(req, res, next) {
  try {
    const { page, limit, type, month } = req.query;
    const data = await sharedTransactionService.list(req.membership, { page, limit, type, month });
    res.json({ status: "success", data: data.items, pagination: data.pagination });
  } catch (err) {
    next(err);
  }
}

export async function createSharedTransaction(req, res, next) {
  try {
    checkValidation(req);
    const data = await sharedTransactionService.create(req.membership, req.body, getClientIp(req));
    res.status(201).json({ status: "success", message: "Shared transaction created", data });
  } catch (err) {
    next(err);
  }
}

export async function updateSharedTransaction(req, res, next) {
  try {
    checkValidation(req);
    const data = await sharedTransactionService.update(
      req.membership,
      req.params.txId,
      req.body,
      getClientIp(req)
    );
    res.json({ status: "success", message: "Shared transaction updated", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteSharedTransaction(req, res, next) {
  try {
    await sharedTransactionService.remove(req.membership, req.params.txId, getClientIp(req));
    res.json({ status: "success", message: "Shared transaction deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getSharedSummary(req, res, next) {
  try {
    const data = await sharedTransactionService.summary(req.membership, { month: req.query.month });
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}
