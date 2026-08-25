import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/auth.service";
import { getMe } from "../services/user.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  function applyTokens(nextToken, nextRefreshToken) {
    localStorage.setItem("token", nextToken);
    if (nextRefreshToken) localStorage.setItem("refresh_token", nextRefreshToken);
    setToken(nextToken);
  }

  async function refreshUser() {
    const me = await getMe();
    setUser(me);
    return me;
  }

  // Sinkronkan `user` (dipakai AdminRoute utk cek role) setiap token berubah,
  // termasuk saat reload halaman dengan token yang sudah tersimpan.
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    refreshUser().catch(() => setUser(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Interceptor api.js (lihat services/api.js) dispatch event ini kalau
  // auto-refresh access token gagal di tengah request (refresh token basi
  // atau kepakai di device lain) -- localStorage sudah dibersihkan di sana,
  // ini cuma sinkronkan state React-nya.
  useEffect(() => {
    function handleAuthLogout() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, []);

  // Mengembalikan data mentah, bukan langsung apply token — pemanggil (Login
  // biasa atau AdminLogin) yang menentukan langkah berikutnya berdasar status.
  async function login(payload) {
    const data = await authService.login(payload);
    if (data.status === "ok") applyTokens(data.token, data.refresh_token);
    return data;
  }

  async function verifyTwoFactor(challengeToken, code) {
    const data = await authService.verifyTwoFactor({ challenge_token: challengeToken, code });
    applyTokens(data.token, data.refresh_token);
    return data;
  }

  async function setupTwoFactor(challengeToken) {
    return authService.setupTwoFactor({ challenge_token: challengeToken });
  }

  async function confirmTwoFactorSetup(challengeToken, code) {
    const data = await authService.confirmTwoFactorSetup({ challenge_token: challengeToken, code });
    applyTokens(data.token, data.refresh_token);
    return data;
  }

  async function register(payload) {
    const data = await authService.register(payload);
    applyTokens(data.token, data.refresh_token);
  }

  async function logout() {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // Diam -- token sisi server boleh saja gagal direvoke (mis. offline),
        // sisi client tetap harus bersih & keluar.
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
  }

  // Dipakai setelah ganti password: token lama diganti tanpa memaksa logout.
  // Endpoint ganti-password cuma menerbitkan access token baru, bukan pasangan
  // refresh token -- refresh token yang ada tetap berlaku apa adanya.
  function replaceToken(nextToken) {
    applyTokens(nextToken);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: !!token,
        user,
        refreshUser,
        login,
        verifyTwoFactor,
        setupTwoFactor,
        confirmTwoFactorSetup,
        register,
        logout,
        replaceToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
