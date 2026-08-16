import * as categoryService from "../services/category.service.js";
import { checkValidation } from "../utils/validation.js";

export async function listCategories(req, res, next) {
  try {
    const data = await categoryService.list(req.userId, req.query.type);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req, res, next) {
  try {
    checkValidation(req);
    const data = await categoryService.create(req.userId, req.body);
    res.status(201).json({ status: "success", message: "Category created", data });
  } catch (err) {
    next(err);
  }
}
