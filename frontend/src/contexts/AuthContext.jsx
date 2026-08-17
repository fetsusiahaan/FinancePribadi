import { createContext, useContext, useState } from "react";
import * as authService from "../services/auth.service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  async function login(payload) {
    const data = await authService.login(payload);
    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  async function register(payload) {
    const data = await authService.register(payload);
    localStorage.setItem("token", data.token);
    setToken(data.token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  // Dipakai setelah ganti password: token lama diganti tanpa memaksa logout.
  function replaceToken(nextToken) {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
  }

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, register, logout, replaceToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
