import { api } from "./api";

export const getCategories = (type) =>
  api.get("/categories", { params: type ? { type } : {} }).then((r) => r.data.data);

export const createCategory = (payload) => api.post("/categories", payload).then((r) => r.data.data);
