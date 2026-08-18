import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/auth.service";
import { getMe } from "../services/user.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);

  function applyToken(nextToken) {
    localStorage.setItem("token", nextToken);
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

  // Mengembalikan data mentah, bukan langsung apply token — pemanggil (Login
  // biasa atau AdminLogin) yang menentukan langkah berikutnya berdasar status.
  async function login(payload) {
    const data = await authService.login(payload);
    if (data.status === "ok") applyToken(data.token);
    return data;
  }

  async function verifyTwoFactor(challengeToken, code) {
    const data = await authService.verifyTwoFactor({ challenge_token: challengeToken, code });
    applyToken(data.token);
    return data;
  }

  async function setupTwoFactor(challengeToken) {
    return authService.setupTwoFactor({ challenge_token: challengeToken });
  }

  async function confirmTwoFactorSetup(challengeToken, code) {
    const data = await authService.confirmTwoFactorSetup({ challenge_token: challengeToken, code });
    applyToken(data.token);
    return data;
  }

  async function register(payload) {
    const data = await authService.register(payload);
    applyToken(data.token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  // Dipakai setelah ganti password: token lama diganti tanpa memaksa logout.
  function replaceToken(nextToken) {
    applyToken(nextToken);
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
