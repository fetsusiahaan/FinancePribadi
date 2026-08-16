import { api } from "./api";

export const getSummary = (month) =>
  api.get("/dashboard/summary", { params: month ? { month } : {} }).then((r) => r.data.data);

export const getCashflow = (months = 6) =>
  api.get("/dashboard/cashflow", { params: { months } }).then((r) => r.data.data);
