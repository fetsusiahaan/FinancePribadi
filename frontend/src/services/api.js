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

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const ip = await getClientIp();
  if (ip) config.headers["X-Client-IP"] = ip;
  return config;
});
