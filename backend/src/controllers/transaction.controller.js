import * as transactionService from "../services/transaction.service.js";
import { checkValidation } from "../utils/validation.js";
import { getClientIp } from "../utils/getClientIp.js";

export async function listTransactions(req, res, next) {
  try {
    const { page, limit, type, category_id: categoryId, month } = req.query;
    const data = await transactionService.list(req.userId, { page, limit, type, categoryId, month });
    res.json({ status: "success", data: data.items, pagination: data.pagination });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req, res, next) {
  try {
    checkValidation(req);
    const data = await transactionService.create(req.userId, req.body, getClientIp(req));
    res.status(201).json({ status: "success", message: "Transaction created", data });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    checkValidation(req);
    const data = await transactionService.update(req.userId, req.params.id, req.body, getClientIp(req));
    res.json({ status: "success", message: "Transaction updated", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    await transactionService.remove(req.userId, req.params.id, getClientIp(req));
    res.json({ status: "success", message: "Transaction deleted" });
  } catch (err) {
    next(err);
  }
}
