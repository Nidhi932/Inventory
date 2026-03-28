function normalizeApiRoot(url) {
  if (!url) return url;
  const trimmed = url.replace(/\/$/, "");
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return normalizeApiRoot(fromEnv);
  if (import.meta.env.DEV) return "/api";
  const port = import.meta.env.VITE_API_PORT || "5001";
  return `http://localhost:${port}/api`;
}

export const BASE_URL = getBaseUrl();

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const handleResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  let data = {};
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      throw httpError(
        text?.slice(0, 120) ||
          `Server error (${res.status}). Is the API running on the same PORT as in .env?`,
        res.status,
      );
    }
  }
  if (!res.ok) {
    throw httpError(
      data.message ||
        `Request failed (${res.status}). Start the API: npm run server`,
      res.status,
    );
  }
  return data;
};

async function apiFetch(url, options = {}) {
  let res;
  try {
    res = await fetch(url, options);
  } catch (e) {
    if (e.status) throw e;
    const err = new Error(
      "Cannot reach the API. Open a second terminal and run: npm run server — or use one command: npm run dev:all",
    );
    err.status = 0;
    throw err;
  }
  return handleResponse(res);
}

export const authAPI = {
  signup: (name, email, password) =>
    apiFetch(`${BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    apiFetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email) =>
    apiFetch(`${BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    apiFetch(`${BASE_URL}/auth/reset-password/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    }),

  getMe: () => apiFetch(`${BASE_URL}/auth/me`, { headers: authHeaders() }),

  updateProfile: (data) =>
    apiFetch(`${BASE_URL}/auth/update-profile`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),

  changePassword: (currentPassword, newPassword) =>
    apiFetch(`${BASE_URL}/auth/change-password`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

export const productsAPI = {
  getAll: (search = "") => {
    const url = search
      ? `${BASE_URL}/products?search=${encodeURIComponent(search)}`
      : `${BASE_URL}/products`;
    return apiFetch(url, { headers: authHeaders() });
  },

  getStats: () =>
    apiFetch(`${BASE_URL}/products/stats`, { headers: authHeaders() }),

  create: (productData) =>
    apiFetch(`${BASE_URL}/products`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(productData),
    }),

  createBulk: (productsArray) =>
    apiFetch(`${BASE_URL}/products/bulk`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ products: productsArray }),
    }),

  buy: (id, quantity, customerName = "Walk-in Customer") =>
    apiFetch(`${BASE_URL}/products/${id}/buy`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ quantity, customerName }),
    }),
};

export const invoicesAPI = {
  getAll: () => apiFetch(`${BASE_URL}/invoices`, { headers: authHeaders() }),

  updateStatus: (id, status) =>
    apiFetch(`${BASE_URL}/invoices/${id}/status`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),

  delete: (id) =>
    apiFetch(`${BASE_URL}/invoices/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }),
};

export { getToken, authHeaders, handleResponse };
