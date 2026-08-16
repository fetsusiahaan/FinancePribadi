import * as dashboardService from "../services/dashboard.service.js";

export async function getSummary(req, res, next) {
  try {
    const data = await dashboardService.getSummary(req.userId, req.query.month);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}

export async function getCashflow(req, res, next) {
  try {
    const data = await dashboardService.getCashflow(req.userId, req.query.months);
    res.json({ status: "success", data });
  } catch (err) {
    next(err);
  }
}
