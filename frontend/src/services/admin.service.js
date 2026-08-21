import { api } from "./api";

export const getOverview = () => api.get("/admin/overview").then((r) => r.data.data);
export const getSystemHealth = () => api.get("/admin/system-health").then((r) => r.data.data);
export const listActivity = (params) => api.get("/admin/activity", { params }).then((r) => r.data.data);
export const listUsers = (params) => api.get("/admin/users", { params }).then((r) => r.data.data);
export const getUserDetail = (id) => api.get(`/admin/users/${id}`).then((r) => r.data.data);
export const updateRole = (id, role) =>
  api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data.data);
export const updateSuspend = (id, isSuspended) =>
  api.patch(`/admin/users/${id}/suspend`, { is_suspended: isSuspended }).then((r) => r.data.data);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`).then((r) => r.data);
export const resetPassword = (id) => api.post(`/admin/users/${id}/reset-password`).then((r) => r.data.data);
