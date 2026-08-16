import { api } from "./api";

export const getBudgets = (month) =>
  api.get("/budgets", { params: month ? { month } : {} }).then((r) => r.data.data);

export const createBudget = (payload) => api.post("/budgets", payload).then((r) => r.data.data);

export const updateBudget = (id, payload) => api.put(`/budgets/${id}`, payload).then((r) => r.data.data);

export const deleteBudget = (id) => api.delete(`/budgets/${id}`).then((r) => r.data);
