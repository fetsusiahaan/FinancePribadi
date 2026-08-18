import { api } from "./api";

export const register = (payload) => api.post("/auth/register", payload).then((r) => r.data.data);
export const login = (payload) => api.post("/auth/login", payload).then((r) => r.data.data);
export const verifyTwoFactor = (payload) => api.post("/auth/login/2fa-verify", payload).then((r) => r.data.data);
export const setupTwoFactor = (payload) => api.post("/auth/login/2fa-setup", payload).then((r) => r.data.data);
export const confirmTwoFactorSetup = (payload) =>
  api.post("/auth/login/2fa-setup/confirm", payload).then((r) => r.data.data);
