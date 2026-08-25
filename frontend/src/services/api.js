import axios from "axios";

export const api = axios.create({ baseURL: "/api/v1" });

// Diambil sekali per sesi tab (di-cache di promise ini) — IP publik user gak
// berubah-ubah tiap request, jadi gak perlu hit ipify.org tiap kali.
let clientIpPromise = null;
function getClientIp() {
  if (!clientIpPromise) {
    clientIpPromise = axios
      .get("https://api.ipify.org/?format=json")
      .then((res) => res.data.ip)
      .catch(() => null);
  }
  return clientIpPromise;
}

// Endpoint auth murni gak boleh masuk siklus auto-refresh (mis. /auth/login
// gagal 401 karena password salah -> bukan sinyal access token expired).
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register", "/auth/refresh"];

api.interceptors.request.use(async (config) => {
  const isAuthEndpoint = AUTH_ENDPOINTS.some((p) => config.url?.startsWith(p));
  const token = localStorage.getItem("token");

  // Sesi lama (sebelum fitur refresh token ada) cuma punya `token` tanpa
  // `refresh_token` -- pasti bakal 401 dan gagal refresh. Putus di sini
  // supaya gak nembak backend berkali-kali sebelum akhirnya di-logout juga.
  if (token && !isAuthEndpoint) {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(new axios.Cancel("Stale session: no refresh token"));
    }
  }

  if (token) config.headers.Authorization = `Bearer ${token}`;
  const ip = await getClientIp();
  if (ip) config.headers["X-Client-IP"] = ip;
  return config;
});

// Satu promise refresh dipakai bersama semua request yang kena 401 barengan
// (mis. Dashboard nembak beberapa endpoint sekaligus) -- cegah tiap request
// manggil /auth/refresh sendiri-sendiri (thundering herd + rotasi saling
// membatalkan token satu sama lain).
let refreshPromise = null;

async function performRefresh() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("No refresh token");
  const res = await axios.post("/api/v1/auth/refresh", { refresh_token: refreshToken });
  return res.data.data;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const { config, response } = err;
    const isAuthEndpoint = config && AUTH_ENDPOINTS.some((p) => config.url?.startsWith(p));

    if (response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        if (!refreshPromise) refreshPromise = performRefresh().finally(() => (refreshPromise = null));
        const data = await refreshPromise;
        localStorage.setItem("token", data.token);
        localStorage.setItem("refresh_token", data.refresh_token);
        return api(config);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.dispatchEvent(new Event("auth:logout"));
      }
    }

    return Promise.reject(err);
  }
);
