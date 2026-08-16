import * as budgetService from "../services/budget.service.js";
import { checkValidation } from "../utils/validation.js";

export async function listBudgets(req, res, next) {
  try {
    const data = await budgetService.list(req.userId, req.query.month);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function createBudget(req, res, next) {
  try {
    checkValidation(req);
    const data = await budgetService.create(req.userId, req.body);
    res.status(201).json({ status: "success", message: "Budget created", data });
  } catch (err) {
    next(err);
  }
}

export async function updateBudget(req, res, next) {
  try {
    checkValidation(req);
    const data = await budgetService.update(req.userId, req.params.id, req.body);
    res.json({ status: "success", message: "Budget updated", data });
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(req, res, next) {
  try {
    await budgetService.remove(req.userId, req.params.id);
    res.json({ status: "success", message: "Budget deleted" });
  } catch (err) {
    next(err);
  }
}
