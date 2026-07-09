/**
 * client.js — Módulo centralizado para chamadas à API.
 * Injeta automaticamente o token JWT de autenticação nos headers.
 */

const BASE_URL = "";

function getToken() {
  return localStorage.getItem("radar_b3_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Token expirado — limpa armazenamento local e recarrega para ir para o login
    localStorage.removeItem("radar_b3_token");
    localStorage.removeItem("radar_b3_user");
    window.location.href = "/login";
    return;
  }

  return res;
}

export const api = {
  get: (path) => request(path, { method: "GET" }),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),

  /** Login com form-urlencoded (exigido pelo OAuth2PasswordRequestForm do FastAPI) */
  loginForm: async (username, password) => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    return res;
  },
};
