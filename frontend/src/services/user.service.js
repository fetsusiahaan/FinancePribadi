import { api } from "./api";

export const getMe = () => api.get("/users/me").then((r) => r.data.data);
export const updateMe = (payload) => api.patch("/users/me", payload).then((r) => r.data.data);
export const changePassword = (payload) => api.put("/users/me/password", payload).then((r) => r.data.data);
export const exportMyData = () => api.get("/users/me/export").then((r) => r.data.data);
export const deleteMe = (payload) => api.delete("/users/me", { data: payload }).then((r) => r.data);
