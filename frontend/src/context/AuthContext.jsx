import React, { createContext, useContext, useState, useCallback } from "react";
import { api } from "@/api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("radar_b3_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = useCallback(async (username, password) => {
    const res = await api.loginForm(username, password);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Erro ao fazer login.");
    }

    localStorage.setItem("radar_b3_token", data.access_token);
    const userObj = { username: data.username };
    localStorage.setItem("radar_b3_user", JSON.stringify(userObj));
    setUser(userObj);
    return userObj;
  }, []);

  const register = useCallback(async (username, password) => {
    const res = await api.post("/api/auth/register", { username, password });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Erro ao criar conta.");
    }

    localStorage.setItem("radar_b3_token", data.access_token);
    const userObj = { username: data.username };
    localStorage.setItem("radar_b3_user", JSON.stringify(userObj));
    setUser(userObj);
    return userObj;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("radar_b3_token");
    localStorage.removeItem("radar_b3_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
