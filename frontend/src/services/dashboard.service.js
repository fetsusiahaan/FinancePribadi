import { api } from "./api";

export const getSummary = () => api.get("/dashboard/summary").then((r) => r.data.data);
