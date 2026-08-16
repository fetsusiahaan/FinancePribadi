import { api } from "./api";

export const getTransactions = (params) => api.get("/transactions", { params }).then((r) => r.data);

export const createTransaction = (payload) => api.post("/transactions", payload).then((r) => r.data.data);

export const updateTransaction = (id, payload) => api.put(`/transactions/${id}`, payload).then((r) => r.data.data);

export const deleteTransaction = (id) => api.delete(`/transactions/${id}`).then((r) => r.data);
